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
  | 'Declined / No Response';

export const PILELINE_STATUSES: SponsorStatus[] = [
  'To Research',
  'Ready to Contact',
  'Contacted',
  'In Conversation',
  'Committed',
  'Declined / No Response',
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
  researchNotes: string;
  status: SponsorStatus;
  priority: 'High' | 'Medium' | 'Low';
  lastContactedAt?: string;
  nextFollowupDate?: string;
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

export type ViewType = 'pipeline' | 'knowledgeBase';
