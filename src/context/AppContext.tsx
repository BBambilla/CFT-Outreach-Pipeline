import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Student, Sponsor, Interaction, EmailTemplate, Resource, SponsorStatus, PILELINE_STATUSES, KnowledgeBaseFile, ViewType } from '../types';
import { loadInitialData } from '../data/initialData';

interface AppContextType {
  role: 'student' | 'coordinator';
  setRole: (role: 'student' | 'coordinator') => void;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  currentUser: Student | null;
  setCurrentUser: (student: Student | null) => void;
  students: Student[];
  sponsors: Sponsor[];
  interactions: Interaction[];
  templates: EmailTemplate[];
  resources: Resource[];
  knowledgeBaseFiles: KnowledgeBaseFile[];
  addKnowledgeBaseFile: (file: KnowledgeBaseFile) => void;
  updateSponsor: (id: string, data: Partial<Sponsor>) => void;
  addInteraction: (interaction: Omit<Interaction, 'id'>) => void;
}

const mockTemplates: EmailTemplate[] = [
  {
    id: 't1',
    title: 'Intro email',
    category: 'Outreach',
    body: 'Hi [Name],\n\nI am reaching out because I saw your work in [Field] and thought our program might align perfectly with your giving priorities.\n\n[Personalized paragraph here]\n\nWould you have 15 minutes next week to connect?\n\nBest,\n[My Name]',
    active: true,
  },
  {
    id: 't2',
    title: 'Follow-up #1',
    category: 'Outreach',
    body: 'Hi [Name],\n\nJust bumping this to the top of your inbox. I realize things get busy!\n\nPlease let me know if you are open to a brief chat.\n\nBest,\n[My Name]',
    active: true,
  }
];

const mockResources: Resource[] = [
  { id: 'r1', title: 'Pitch Deck 2025', category: 'Pitch', tags: ['Contacted', 'Ready to Contact'], pinned: true, requiredReading: true },
  { id: 'r2', title: 'LinkedIn Outreach Guide', category: 'Training', tags: ['To Research'], pinned: false, requiredReading: true },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { initialStudents, initialSponsors } = useMemo(() => loadInitialData(), []);
  
  const [role, setRole] = useState<'student' | 'coordinator'>('student');
  const [currentView, setCurrentView] = useState<ViewType>('pipeline');
  const [students] = useState<Student[]>(initialStudents);
  const [currentUser, setCurrentUser] = useState<Student | null>(initialStudents[0] || null);
  const [sponsors, setSponsors] = useState<Sponsor[]>(initialSponsors);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [templates] = useState<EmailTemplate[]>(mockTemplates);
  const [resources] = useState<Resource[]>(mockResources);
  const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState<KnowledgeBaseFile[]>([]);

  const updateSponsor = (id: string, data: Partial<Sponsor>) => {
    setSponsors(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const addInteraction = (interaction: Omit<Interaction, 'id'>) => {
    setInteractions(prev => [{ ...interaction, id: uuidv4() }, ...prev]);
  };

  const addKnowledgeBaseFile = (file: KnowledgeBaseFile) => {
    setKnowledgeBaseFiles(prev => [file, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      role, setRole,
      currentView, setCurrentView,
      currentUser, setCurrentUser,
      students, sponsors, interactions, templates, resources, knowledgeBaseFiles, addKnowledgeBaseFile,
      updateSponsor, addInteraction
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
