export type Role = 'student' | 'coordinator';

export interface Student {
  id: string;
  name: string;
  email: string;
  country: string;
  continent: string;
  photo?: string;
  coordinatorNotes?: string;
}

export type SponsorStatus =
  | 'To Research'
  | 'Ready to Contact'
  | 'Contacted'
  | 'In Conversation'
  | 'Committed'
  | 'Registered / Enrolled'
  | 'Declined';

export const PILELINE_STATUSES: SponsorStatus[] = [
  'To Research',
  'Ready to Contact',
  'Contacted',
  'In Conversation',
  'Committed',
  'Registered / Enrolled',
  'Declined',
];

export interface Sponsor {
  id: string;
  assignedStudentId: string;
  organization: string;
  contactName: string;
  role: string;
  email: string;
  phone: string;
  website: string;
  rationale: string; // "Why Good Fit"
  sourceNotes: string;
  classification?: 'Registry' | 'CFT Training' | 'Sponsorships';
  researchNotes: string;
  status: SponsorStatus;
  priority: 'High' | 'Medium' | 'Low';
  has_new_reply?: boolean;
  last_reply_at?: string;
  lastContactedAt?: string;
  nextFollowupDate?: string;
  archived?: boolean;
  archivedFromStatus?: string;
  createdAt: string;
}

export type InteractionType = 'Email sent' | 'Email received' | 'Call' | 'Text' | 'Online Meeting' | 'Face-to-Face Meeting' | 'LinkedIn' | 'Note' | 'File sent' | 'File received';

export interface Interaction {
  id: string;
  sponsorId: string;
  type: InteractionType;
  date: string;
  summary: string;
  attachment?: string;
  outcome?: string;
}

export interface EmailTemplate {
  id: string;
  title: string;
  category: string;
  subject: string;
  body: string;
  active: boolean;
}

export interface Resource {
  id: string;
  title: string;
  category: string;
  tags: string[];
  pinned: boolean; // false
  requiredReading: boolean; // false
}

export interface KnowledgeBaseFile {
  id: string;
  title: string;
  url?: string;
  uploadedAt: string;
  size?: number; // Size in bytes
  type?: string;
}

export interface InboundMessage {
  id: string;
  sponsor_id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  body_text: string;
  received_at: string;
  read: boolean;
}

export interface SupportRequest {
  id: string;
  student_id: string;
  rep_name: string;
  country: string;
  subject: string;
  message: string;
  created_at: string;
}

export type ViewType = 'pipeline' | 'knowledgeBase';
