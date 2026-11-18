export type UserRole = 'admin' | 'project_manager' | 'developer' | 'designer' | 'client';

export interface AuthUser {
  id: number;
  firebaseUid?: string | null;
  name: string;
  email: string;
  phone: string;
  company: string;
  isActive: boolean;
  status?: 'active' | 'disabled';
  roles: UserRole[];
  primaryRole: UserRole;
}

export interface AdminUserRow {
  id: number;
  firebase_uid?: string | null;
  name: string;
  email: string;
  phone: string;
  company: string;
  is_active: number;
  created_at: string;
  roles_csv: string;
}

export interface AuditLogRow {
  id: number;
  actor_user_id: number | null;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata_json: string;
  ip_address: string;
  created_at: string;
}

export interface ServiceItem {
  id: number;
  slug: string;
  category: string;
  title: string;
  summary: string;
  description: string;
  features: string[];
  technologies: string[];
  useCases: string[];
  is_published: number;
}

export interface PortfolioProject {
  id: number;
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  challenges: string;
  solution: string;
  technologies: string[];
  screenshots: string[];
  live_url: string;
  github_url: string;
  is_published: number;
}

export interface TeamMember {
  id: number;
  user_id?: number | null;
  name: string;
  designation: string;
  roleCategory: string;
  bio: string;
  avatarUrl: string;
  skills: string[];
  responsibilities: string[];
  portfolioLinks: { label: string; url: string }[];
  isFounder: boolean;
  isActive?: boolean;
}

export interface BlogPostItem {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tag: string;
  image_url: string;
  created_at: string;
}

export interface PublicReview {
  id: number;
  author_name: string;
  author_role: string;
  rating: number;
  comment: string;
  created_at: string;
  is_published?: number;
}

export interface InquiryRecord {
  id: number;
  inquiry_code: string;
  client_user_id: number | null;
  client_name: string;
  email: string;
  phone: string;
  company: string;
  project_title: string;
  category: string;
  description: string;
  required_features: string;
  preferred_tech: string;
  budget_range: string;
  timeline: string;
  reference_urls: string;
  status: string;
  admin_notes?: string;
  created_at: string;
}

export interface MilestoneRecord {
  id: number;
  project_id: number;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  amount_inr: number;
}

export interface TaskRecord {
  id: number;
  project_id: number;
  milestone_id: number | null;
  title: string;
  description: string;
  assigned_to_user_id: number | null;
  assignee_name?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
  internal_notes: string;
}

export interface ProjectUpdateRecord {
  id: number;
  project_id: number;
  author_user_id: number;
  author_name: string;
  visibility: 'client' | 'internal';
  title: string;
  body: string;
  deliverable_attachment_id: number | null;
  deliverable_name?: string | null;
  client_feedback: string;
  approved_by_client: number;
  created_at: string;
}

export interface ProjectRecord {
  id: number;
  project_code: string;
  title: string;
  description: string;
  client_user_id: number;
  client_name?: string;
  client_email?: string;
  manager_user_id: number | null;
  manager_name?: string;
  status: string;
  start_date: string;
  expected_delivery_date: string;
  progress: number;
  milestones?: MilestoneRecord[];
}

export interface ProposalLineItem {
  id: number;
  title: string;
  description: string;
  amount_inr: number;
}

export interface ProposalRecord {
  id: number;
  proposal_code: string;
  inquiry_id: number | null;
  project_id: number | null;
  client_user_id: number;
  client_name?: string;
  client_email?: string;
  title: string;
  scope_summary: string;
  timeline: string;
  payment_schedule: string;
  terms: string;
  total_amount_inr: number;
  status: 'draft' | 'sent' | 'viewed' | 'revision_requested' | 'accepted' | 'rejected' | 'expired';
  client_revision_note: string;
  created_at: string;
  items: ProposalLineItem[];
}

export interface PaymentRecord {
  id: number;
  payment_code: string;
  project_id: number | null;
  project_title?: string;
  client_name?: string;
  amount_inr: number;
  currency: string;
  payment_type: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  status: 'pending' | 'processing' | 'successful' | 'failed' | 'refunded';
  created_at: string;
}

export interface InvoiceRecord {
  id: number;
  invoice_number: string;
  payment_id: number;
  payment_code?: string;
  razorpay_payment_id?: string;
  project_title?: string;
  client_name?: string;
  amount_inr: number;
  status: string;
  issued_at: string;
}

export interface ConversationRecord {
  id: number;
  project_id: number;
  project_code: string;
  project_title: string;
  channel_type: 'client_team' | 'internal_team';
  title: string;
}

export interface ChatMessageRecord {
  id: number;
  conversation_id: number;
  sender_user_id: number;
  sender_name: string;
  body: string;
  attachment_id: number | null;
  attachment_name?: string | null;
  attachment_mime?: string | null;
  is_deleted: number;
  created_at: string;
}

export interface NotificationRecord {
  id: number;
  type: string;
  title: string;
  message: string;
  link_path: string;
  is_read: number;
  created_at: string;
}
