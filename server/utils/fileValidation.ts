import fs from 'node:fs';

/**
 * Validates that an uploaded file on disk actually matches its declared MIME type
 * using magic-byte signatures and structural checks.
 */
export function validateUploadedFileSignature(filePath: string, declaredMime: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  let fd: number | null = null;
  try {
    const stat = fs.statSync(filePath);
    if (stat.size <= 0) return false;

    const readLen = Math.min(stat.size, 8192);
    const buf = Buffer.alloc(readLen);
    fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buf, 0, readLen, 0);
    const slice = buf.subarray(0, bytesRead);

    switch (declaredMime) {
      case 'application/pdf':
        return slice.length >= 5 && slice.subarray(0, 5).toString('ascii') === '%PDF-';

      case 'image/png':
        return (
          slice.length >= 8 &&
          slice[0] === 0x89 &&
          slice[1] === 0x50 &&
          slice[2] === 0x4e &&
          slice[3] === 0x47 &&
          slice[4] === 0x0d &&
          slice[5] === 0x0a &&
          slice[6] === 0x1a &&
          slice[7] === 0x0a
        );

      case 'image/jpeg':
        return slice.length >= 3 && slice[0] === 0xff && slice[1] === 0xd8 && slice[2] === 0xff;

      case 'image/webp':
        return (
          slice.length >= 12 &&
          slice.subarray(0, 4).toString('ascii') === 'RIFF' &&
          slice.subarray(8, 12).toString('ascii') === 'WEBP'
        );

      case 'application/zip':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return (
          slice.length >= 4 &&
          slice[0] === 0x50 &&
          slice[1] === 0x4b &&
          ((slice[2] === 0x03 && slice[3] === 0x04) ||
            (slice[2] === 0x05 && slice[3] === 0x06) ||
            (slice[2] === 0x07 && slice[3] === 0x08))
        );

      case 'text/plain': {
        // Disallow binary NULL bytes, ELF/PE executables, or active HTML/script tags
        for (let i = 0; i < slice.length; i++) {
          if (slice[i] === 0x00) return false;
        }
        const text = slice.toString('utf8');
        if (text.includes('\uFFFD')) return false;
        const lower = text.trimStart().toLowerCase();
        if (lower.startsWith('<!doctype html') || lower.startsWith('<html') || lower.includes('<script')) {
          return false;
        }
        return true;
      }

      default:
        return false;
    }
  } catch {
    return false;
  } finally {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {
        // Ignore close error
      }
    }
  }
}

export function cleanupUploadedFiles(files: Array<{ path?: string }> | { path?: string } | undefined | null): void {
  if (!files) return;
  const list = Array.isArray(files) ? files : [files];
  for (const f of list) {
    if (f?.path) {
      try {
        if (fs.existsSync(f.path)) {
          fs.unlinkSync(f.path);
        }
      } catch {
        // Ignore cleanup failure
      }
    }
  }
}
