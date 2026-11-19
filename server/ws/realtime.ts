import type { Server as HttpServer, IncomingMessage } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { db } from '../db/database.ts';
import {
  authenticateFirebaseIdToken,
  loadUserById,
  verifySignedToken,
  SESSION_COOKIE_NAME,
  type AuthUser,
} from '../middleware/auth.ts';

interface ClientSocket extends WebSocket {
  user?: AuthUser;
  rooms?: Set<number>;
  isAlive?: boolean;
}

const userSockets = new Map<number, Set<ClientSocket>>();

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      const key = part.slice(0, eq).trim();
      const val = decodeURIComponent(part.slice(eq + 1).trim());
      out[key] = val;
    }
  }
  return out;
}

export function canUserAccessConversation(user: AuthUser, conversationId: number): boolean {
  if (!user.isActive) return false;
  const convo = db
    .prepare(`
      SELECT c.id, c.project_id, c.channel_type, p.client_user_id, p.manager_user_id
      FROM conversations c
      JOIN projects p ON p.id = c.project_id
      WHERE c.id = ?
    `)
    .get(conversationId) as
    | {
        id: number;
        project_id: number;
        channel_type: 'client_team' | 'internal_team';
        client_user_id: number;
        manager_user_id: number | null;
      }
    | undefined;

  if (!convo) return false;

  if (convo.channel_type === 'internal_team' && user.primaryRole === 'client') {
    return false;
  }

  if (user.roles.includes('admin')) return true;
  if (convo.manager_user_id === user.id) return true;
  if (convo.channel_type === 'client_team' && convo.client_user_id === user.id) return true;

  const isMember = db
    .prepare(`SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?`)
    .get(convo.project_id, user.id);

  return Boolean(isMember);
}

export function broadcastToConversation(conversationId: number, payload: unknown): void {
  const serialized = JSON.stringify(payload);
  for (const sockets of userSockets.values()) {
    for (const sock of sockets) {
      if (sock.readyState !== WebSocket.OPEN || !sock.rooms?.has(conversationId) || !sock.user) {
        continue;
      }
      const freshUser = loadUserById(sock.user.id);
      if (!freshUser || !canUserAccessConversation(freshUser, conversationId)) {
        sock.rooms.delete(conversationId);
        continue;
      }
      sock.user = freshUser;
      sock.send(serialized);
    }
  }
}

export function sendRealtimeNotification(userId: number, notification: Record<string, unknown>): void {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const payload = JSON.stringify({ event: 'notification:new', data: notification });
  for (const sock of sockets) {
    if (sock.readyState === WebSocket.OPEN) {
      sock.send(payload);
    }
  }
}

export function disconnectUserSockets(userId: number): void {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  for (const sock of sockets) {
    try {
      sock.close(4003, 'Session updated or disabled');
    } catch {
      sock.terminate();
    }
  }
  userSockets.delete(userId);
}

export function attachWebSocketServer(httpServer: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', async (req: IncomingMessage, socket, head) => {
    const reqUrl = req.url || '';
    if (!reqUrl.startsWith('/ws')) {
      return;
    }

    try {
      const parsedUrl = new URL(reqUrl, `http://${req.headers.host || 'localhost'}`);
      // Reject Firebase tokens in URL query parameters to prevent proxy/access log leakage
      if (parsedUrl.searchParams.has('token')) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      const cookies = parseCookies(req.headers.cookie);
      const idToken = cookies[SESSION_COOKIE_NAME] ? verifySignedToken(cookies[SESSION_COOKIE_NAME]) || '' : '';

      if (!idToken) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      const auth = await authenticateFirebaseIdToken(idToken);
      if (!auth || auth.disabled) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        const clientWs = ws as ClientSocket;
        clientWs.user = auth.user;
        clientWs.rooms = new Set<number>();
        clientWs.isAlive = true;
        wss.emit('connection', clientWs, req);
      });
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });

  wss.on('connection', (ws: ClientSocket) => {
    const user = ws.user;
    if (!user) {
      ws.close();
      return;
    }

    if (!userSockets.has(user.id)) {
      userSockets.set(user.id, new Set());
    }
    userSockets.get(user.id)!.add(ws);

    ws.send(
      JSON.stringify({
        event: 'presence:connected',
        data: { userId: user.id, role: user.primaryRole },
      })
    );

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw) => {
      try {
        const parsed = JSON.parse(raw.toString()) as {
          event?: string;
          type?: string;
          conversationId?: number;
        };
        const evt = parsed.event || parsed.type;
        if (evt === 'room:join' && typeof parsed.conversationId === 'number') {
          const freshUser = loadUserById(user.id);
          if (freshUser && canUserAccessConversation(freshUser, parsed.conversationId)) {
            ws.user = freshUser;
            ws.rooms?.add(parsed.conversationId);
            ws.send(
              JSON.stringify({
                event: 'room:joined',
                data: { conversationId: parsed.conversationId },
              })
            );
          } else {
            ws.send(JSON.stringify({ event: 'error', data: { message: 'Access denied to conversation' } }));
          }
        } else if (evt === 'room:leave' && typeof parsed.conversationId === 'number') {
          ws.rooms?.delete(parsed.conversationId);
        }
      } catch {
        // Ignore malformed websocket frames
      }
    });

    ws.on('close', () => {
      const set = userSockets.get(user.id);
      if (set) {
        set.delete(ws);
        if (set.size === 0) {
          userSockets.delete(user.id);
        }
      }
    });
  });

  const heartbeat = setInterval(() => {
    for (const client of wss.clients) {
      const c = client as ClientSocket;
      if (c.isAlive === false) {
        c.terminate();
        continue;
      }
      c.isAlive = false;
      c.ping();
    }
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));
}
