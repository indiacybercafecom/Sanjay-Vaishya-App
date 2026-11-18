import { DatabaseSync } from 'node:sqlite';
import { DB_PATH } from '../config/env.ts';

export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA busy_timeout = 5000;');
db.exec('PRAGMA foreign_keys = ON;');

export function closeDatabase(): void {
  try {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    db.close();
  } catch (err) {
    console.error('Database close error:', err);
  }
}

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firebase_uid TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT DEFAULT '',
      company TEXT DEFAULT '',
      password_hash TEXT DEFAULT '',
      email_verified INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('admin', 'project_manager', 'developer', 'designer', 'client')),
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, role)
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      designation TEXT NOT NULL,
      role_category TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      skills_json TEXT NOT NULL DEFAULT '[]',
      responsibilities_json TEXT NOT NULL DEFAULT '[]',
      portfolio_links_json TEXT NOT NULL DEFAULT '[]',
      is_founder INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 10,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      description TEXT NOT NULL,
      features_json TEXT NOT NULL DEFAULT '[]',
      technologies_json TEXT NOT NULL DEFAULT '[]',
      use_cases_json TEXT NOT NULL DEFAULT '[]',
      is_published INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 10,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS portfolio_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      description TEXT NOT NULL,
      challenges TEXT NOT NULL DEFAULT '',
      solution TEXT NOT NULL DEFAULT '',
      technologies_json TEXT NOT NULL DEFAULT '[]',
      screenshots_json TEXT NOT NULL DEFAULT '[]',
      live_url TEXT DEFAULT '',
      github_url TEXT DEFAULT '',
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_code TEXT NOT NULL UNIQUE,
      client_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      client_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      company TEXT DEFAULT '',
      project_title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      required_features TEXT NOT NULL DEFAULT '',
      preferred_tech TEXT DEFAULT '',
      budget_range TEXT NOT NULL,
      timeline TEXT NOT NULL,
      reference_urls TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Under Review', 'Discussion', 'Proposal Sent', 'Accepted', 'Rejected', 'Converted to Project')),
      admin_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      client_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      manager_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      inquiry_id INTEGER REFERENCES inquiries(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Inquiry', 'Planning', 'Proposal', 'Approved', 'In Progress', 'Review', 'Testing', 'Completed', 'Delivered', 'On Hold', 'Cancelled')),
      start_date TEXT DEFAULT '',
      expected_delivery_date TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_label TEXT NOT NULL DEFAULT 'Developer',
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      due_date TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed')),
      amount_inr INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      milestone_id INTEGER REFERENCES milestones(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
      due_date TEXT DEFAULT '',
      internal_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      inquiry_id INTEGER REFERENCES inquiries(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      author_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      visibility TEXT NOT NULL DEFAULT 'client' CHECK (visibility IN ('client', 'internal')),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      deliverable_attachment_id INTEGER REFERENCES attachments(id) ON DELETE SET NULL,
      client_feedback TEXT DEFAULT '',
      approved_by_client INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_code TEXT NOT NULL UNIQUE,
      inquiry_id INTEGER REFERENCES inquiries(id) ON DELETE SET NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      client_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      scope_summary TEXT NOT NULL,
      timeline TEXT NOT NULL,
      payment_schedule TEXT NOT NULL,
      terms TEXT NOT NULL,
      total_amount_inr INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'revision_requested', 'accepted', 'rejected', 'expired')),
      client_revision_note TEXT DEFAULT '',
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS proposal_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      amount_inr INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_code TEXT NOT NULL UNIQUE,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      milestone_id INTEGER REFERENCES milestones(id) ON DELETE SET NULL,
      proposal_id INTEGER REFERENCES proposals(id) ON DELETE SET NULL,
      client_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount_inr INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      payment_type TEXT NOT NULL DEFAULT 'milestone' CHECK (payment_type IN ('advance', 'milestone', 'balance')),
      razorpay_order_id TEXT DEFAULT '',
      razorpay_payment_id TEXT DEFAULT '',
      razorpay_signature TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'successful', 'failed', 'refunded')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      payment_id INTEGER NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      client_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount_inr INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'issued',
      issued_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      channel_type TEXT NOT NULL CHECK (channel_type IN ('client_team', 'internal_team')),
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(project_id, channel_type)
    );

    CREATE TABLE IF NOT EXISTS conversation_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_read_at TEXT DEFAULT '',
      UNIQUE(conversation_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      attachment_id INTEGER REFERENCES attachments(id) ON DELETE SET NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link_path TEXT DEFAULT '/dashboard',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL,
      author_role TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      tag TEXT NOT NULL,
      image_url TEXT DEFAULT '',
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT DEFAULT '',
      details_json TEXT DEFAULT '{}',
      ip_address TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS application_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
    CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_messages_convo ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);

  runSafeMigrations();
  seedAuthoritativeData();
}

function runSafeMigrations(): void {
  const columns = db.prepare(`PRAGMA table_info(users)`).all() as { name: string }[];
  const hasFirebaseUid = columns.some((c) => c.name === 'firebase_uid');
  if (!hasFirebaseUid) {
    db.exec(`ALTER TABLE users ADD COLUMN firebase_uid TEXT;`);
  }
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);`);
  // Drop obsolete SQLite session table if it exists from pre-Firebase auth
  db.exec(`DROP TABLE IF EXISTS sessions;`);
}

function seedAuthoritativeData(): void {
  const serviceCount = db.prepare('SELECT COUNT(*) as cnt FROM services').get() as { cnt: number };
  if (serviceCount.cnt === 0) {
    const insertService = db.prepare(`
      INSERT INTO services (slug, category, title, summary, description, features_json, technologies_json, use_cases_json, is_published, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const services = [
      [
        'website-development',
        'Website Development',
        'Website Development',
        'Business websites, portfolio sites, landing pages, e-commerce stores, WordPress, and custom web applications.',
        'Responsive, high-speed web platforms engineered for clear business communication, lead conversion, and maintainable code structure.',
        JSON.stringify([
          'Business and corporate websites',
          'Portfolio and personal brand systems',
          'High-conversion landing pages',
          'E-commerce and product catalogs',
          'WordPress CMS customization',
          'Custom React & TypeScript web apps',
        ]),
        JSON.stringify(['React', 'TypeScript', 'Tailwind CSS', 'HTML5/CSS3', 'WordPress', 'Node.js']),
        JSON.stringify(['Local & regional businesses', 'Product launches', 'Online storefronts', 'Service providers']),
        1,
      ],
      [
        'mobile-app-development',
        'Mobile App Development',
        'Mobile App Development',
        'Android applications, business mobile tools, custom mobile apps, WebView containers, and ongoing app maintenance.',
        'Dedicated mobile applications designed for everyday reliability on Android devices, synchronized with backend APIs and PWA capabilities.',
        JSON.stringify([
          'Native and hybrid Android applications',
          'Internal business operations apps',
          'Custom mobile software',
          'Hardened WebView mobile wrappers',
          'Play Console compliance & maintenance',
        ]),
        JSON.stringify(['Android', 'React / PWA', 'TypeScript', 'REST APIs', 'WebSockets']),
        JSON.stringify(['Field service tools', 'Client companion apps', 'Customer portals']),
        2,
      ],
      [
        'full-stack-development',
        'Full-Stack Development',
        'Full-Stack Development',
        'Frontend interfaces, backend servers, REST & WebSocket APIs, database architecture, authentication, and third-party integrations.',
        'End-to-end engineering covering UI architecture, Express APIs, normalized relational databases, role-based access control, and external webhooks.',
        JSON.stringify([
          'Modular frontend architecture',
          'Node.js & Express backend APIs',
          'Normalized SQL database design',
          'Role-based authentication & RBAC',
          'Payment, email, and webhook integrations',
        ]),
        JSON.stringify(['React', 'Node.js', 'Express', 'SQLite / PostgreSQL', 'WebSockets']),
        JSON.stringify(['Client portals', 'Marketplace backends', 'Custom web software']),
        3,
      ],
      [
        'custom-software-development',
        'Custom Software Development',
        'Custom Software Development',
        'CRM systems, ERP solutions, admin dashboards, management systems, automation platforms, and SaaS applications.',
        'Tailored business software engineered around exact operational workflows, role permissions, reporting pipelines, and multi-user collaboration.',
        JSON.stringify([
          'Customer Relationship Management (CRM)',
          'Enterprise Resource Planning (ERP)',
          'Executive & operational admin dashboards',
          'Workflow & inventory management systems',
          'Multi-tenant SaaS architectures',
        ]),
        JSON.stringify(['TypeScript', 'React', 'Express', 'Relational SQL', 'PDF Generation']),
        JSON.stringify(['Growing teams', 'Service agencies', 'Educational & retail operations']),
        4,
      ],
      [
        'ui-ux-design',
        'UI/UX Design',
        'UI/UX Design',
        'Interface design, user experience planning, structured wireframes, responsive grid layouts, and dashboard architecture.',
        'Technical interface systems engineered for clarity, contrast accessibility, fast scanning, and consistent cross-device interaction.',
        JSON.stringify([
          'Information architecture & user flows',
          'Low- and high-fidelity wireframes',
          'Design system & component libraries',
          'Mobile-first responsive layouts',
          'Data-dense dashboard interfaces',
        ]),
        JSON.stringify(['Design Systems', 'CSS Grid', 'Tailwind CSS', 'WCAG AA Accessibility']),
        JSON.stringify(['SaaS dashboards', 'Web platforms', 'Mobile app interfaces']),
        5,
      ],
      [
        'deployment-devops',
        'Deployment & DevOps',
        'Deployment & DevOps',
        'Hosting configuration, server deployment, domain & DNS setup, CI/CD pipelines, and runtime performance tuning.',
        'Production infrastructure setup across Hostinger, VPS servers, and cloud runtimes with HTTPS configuration, caching policies, and monitoring.',
        JSON.stringify([
          'Hostinger & VPS server configuration',
          'Production build & Node.js deployment',
          'Domain DNS & SSL setup',
          'Automated CI/CD build workflows',
          'Asset & latency optimization',
        ]),
        JSON.stringify(['Linux', 'Node.js', 'Hostinger hPanel', 'Nginx', 'Cloud Run']),
        JSON.stringify(['Production launches', 'Server migrations', 'Speed optimization']),
        6,
      ],
      [
        'maintenance-support',
        'Maintenance & Technical Support',
        'Maintenance & Technical Support',
        'Bug fixing, ongoing website maintenance, application upgrades, security hardening, and direct technical consulting.',
        'Continuous engineering support to diagnose regressions, patch security vulnerabilities, update dependencies, and keep production systems stable.',
        JSON.stringify([
          'Root-cause debugging & bug resolution',
          'Routine website & database backups',
          'Feature enhancements & version upgrades',
          'Authentication & endpoint hardening',
          'Direct technical consultation',
        ]),
        JSON.stringify(['Diagnostics', 'Security Audits', 'SQL Optimization', 'Git']),
        JSON.stringify(['Existing web apps', 'Legacy site rescues', 'Long-term retainers']),
        7,
      ],
    ];

    for (const s of services) {
      insertService.run(...s);
    }
  }

  const teamCount = db.prepare('SELECT COUNT(*) as cnt FROM team_members').get() as { cnt: number };
  if (teamCount.cnt === 0) {
    db.prepare(`
      INSERT INTO team_members (name, designation, role_category, bio, avatar_url, skills_json, responsibilities_json, portfolio_links_json, is_founder, is_active, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1)
    `).run(
      'Sanjay Vaishya',
      'Founder & Lead Full-Stack Developer',
      'Full-Stack Developer',
      'Founder of the Sanjay Vaishya development team and India Cyber Cafe in Singrauli, Madhya Pradesh. Leads technical architecture, full-stack engineering, client planning, and quality assurance across delivered software projects.',
      'https://sanjay.indiacybercafe.com/uploads/sanjay/sanjay%20kumar%20vaishya%20hero%20image.png',
      JSON.stringify(['TypeScript', 'React', 'Node.js', 'Express', 'SQL Architecture', 'Hostinger & Linux Deployment']),
      JSON.stringify([
        'Technical leadership',
        'Architecture and development',
        'Project planning',
        'Client communication',
        'Team coordination',
        'Quality assurance',
        'Project delivery',
      ]),
      JSON.stringify([
        { label: 'Official Website', url: 'https://sanjay.indiacybercafe.com' },
        { label: 'Collections', url: 'https://sanjay.indiacybercafe.com/posts/sanjay-collections.html' },
      ])
    );
  }

  const portfolioCount = db.prepare('SELECT COUNT(*) as cnt FROM portfolio_projects').get() as { cnt: number };
  if (portfolioCount.cnt === 0) {
    const insertPortfolio = db.prepare(`
      INSERT INTO portfolio_projects (slug, title, category, summary, description, challenges, solution, technologies_json, screenshots_json, live_url, github_url, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertPortfolio.run(
      'india-cyber-cafe-portal',
      'India Cyber Cafe Digital Service Portal',
      'Website Development',
      'Public digital service hub connecting Singrauli community members with technical documentation, guides, and direct support channels.',
      'Designed and deployed a fast web portal for India Cyber Cafe to distribute step-by-step deployment guides, digital service updates, and direct contact workflows.',
      'Users on low-bandwidth mobile networks needed fast initial render times and clear step-by-step technical guides without cluttered navigation.',
      'Structured semantic HTML/CSS/JS pages with lightweight assets, direct Hostinger deployment pipelines, and clear multi-channel contact routing.',
      JSON.stringify(['HTML5', 'CSS3', 'JavaScript', 'Hostinger hPanel', 'Responsive Grid']),
      JSON.stringify(['https://sanjay.indiacybercafe.com/uploads/sanjay/sanjay%20kumar%20vaishya%20hero%20image.png']),
      'https://sanjay.indiacybercafe.com',
      ''
    );

    insertPortfolio.run(
      'sanjay-vaishya-project-platform',
      'Sanjay Vaishya Full-Stack Project Platform',
      'Full-Stack Development',
      'Unified agency showcase, client inquiry intake, proposal review, milestone tracking, and real-time team collaboration workspace.',
      'Built an end-to-end software development business platform combining a mobile-first technical agency front-end with Firebase-authenticated client dashboards, role-based access control, and WebSocket messaging.',
      'Coordinating client inquiries, quotations, milestone progress, and team communication in one secure application without exposing internal notes or another client’s files.',
      'Engineered an Express + Firebase Auth/RTDB + SQLite backend with Firebase ID token verification, strict server-side role checks, private attachment storage, and room-isolated WebSocket chat.',
      JSON.stringify(['React', 'TypeScript', 'Tailwind CSS', 'Firebase Auth', 'Node.js', 'SQLite', 'WebSockets']),
      JSON.stringify([]),
      'https://app-sanjay.indiacybercafe.com',
      ''
    );
  }

  const blogCount = db.prepare('SELECT COUNT(*) as cnt FROM blog_posts').get() as { cnt: number };
  if (blogCount.cnt === 0) {
    const insertBlog = db.prepare(`
      INSERT INTO blog_posts (slug, title, summary, content, category, tag, image_url, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    insertBlog.run(
      'deploy-guide',
      'How to Deploy a Website on Hostinger (Step-by-Step Guide)',
      'Learn how to publish your website live on the internet using Hostinger. Complete workflow for HTML, CSS, JS, and PHP builds.',
      'Full deployment workflow covering hPanel login, File Manager public_html directory structure, ZIP extraction, index.html configuration, PHP support, and DNS propagation.',
      'Guides',
      'Deployment',
      'https://indiacybercafe.com/wp-content/uploads/2026/04/Deploy_Website_HTML_202604031034.jpeg'
    );
    insertBlog.run(
      'blog-guide',
      'How to Build a Website with HTML, CSS, and JS (Step-by-Step Guide)',
      'Build a structured, responsive website from scratch using clean HTML markup, CSS Grid layouts, and JavaScript.',
      'Foundational frontend engineering guide covering project folder setup, semantic HTML structure, CSS Grid layout styling, JavaScript interactivity, and mobile verification.',
      'Guides',
      'Frontend',
      'https://indiacybercafe.com/wp-content/uploads/2026/04/HTML_CSS_JS.jpeg'
    );
  }

  const settingsCount = db.prepare('SELECT COUNT(*) as cnt FROM application_settings').get() as { cnt: number };
  if (settingsCount.cnt === 0) {
    const insertSetting = db.prepare(`
      INSERT INTO application_settings (key, value_json) VALUES (?, ?)
    `);
    insertSetting.run('brand_name', JSON.stringify('Sanjay Vaishya'));
    insertSetting.run('brand_tagline', JSON.stringify('We Design, Develop & Deliver Digital Solutions.'));
    insertSetting.run('contact_email', JSON.stringify('sanjayvaishya.dev@gmail.com'));
    insertSetting.run('contact_phone', JSON.stringify('+91 9203251821'));
    insertSetting.run('office_address', JSON.stringify('Jobgarh, Singrauli, Madhya Pradesh, India (486886)'));
    insertSetting.run('updates_external_url', JSON.stringify('https://sanjay.indiacybercafe.com/updates.html'));
  }
}
