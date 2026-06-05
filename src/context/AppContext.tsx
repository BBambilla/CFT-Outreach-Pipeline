import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Student, Sponsor, Interaction, EmailTemplate, Resource, SponsorStatus, PILELINE_STATUSES, KnowledgeBaseFile, ViewType } from '../types';
import { loadInitialData } from '../data/initialData';

interface AppContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
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
  deleteSponsor: (id: string) => void;
  addSponsor: (sponsor: Sponsor) => void;
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
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<'student' | 'coordinator'>('student');
  const [currentView, setCurrentView] = useState<ViewType>('pipeline');
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const stored = localStorage.getItem('students');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing stored students', e);
    }
    return initialStudents;
  });

  React.useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
  }, [students]);

  const [currentUser, setCurrentUser] = useState<Student | null>(() => {
    try {
      const storedSId = localStorage.getItem('currentUserId');
      if (storedSId) {
        const parsed = JSON.parse(storedSId);
        if (parsed) {
          // We will match after state init, but for now use initialStudents or students
          return initialStudents.find(s => s.id === parsed) || initialStudents[0] || null;
        }
      }
    } catch (e) {
      console.error('Error parsing stored currentUserId', e);
    }
    return initialStudents[0] || null;
  });

  React.useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUserId', JSON.stringify(currentUser.id));
    }
  }, [currentUser]);

  const [sponsors, setSponsors] = useState<Sponsor[]>(() => {
    try {
      const stored = localStorage.getItem('sponsors');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          const freshSponsorMap = new Map<string, Sponsor>(initialSponsors.map(s => [s.organization, s]));
          
          const mergedSponsors = parsed.map((s: Sponsor) => {
             const freshSponsor = freshSponsorMap.get(s.organization);
             if (freshSponsor) {
               // Mark as seen so we don't duplicate
               freshSponsorMap.delete(s.organization);
               // Update the old sponsor with the correct fresh deterministic assignedStudentId and sponsor id
               return { ...s, id: freshSponsor.id, assignedStudentId: freshSponsor.assignedStudentId };
             }
             return s;
          });

          // Append any NEW sponsors from the initialSponsors that weren't in localStorage
          return [...mergedSponsors, ...Array.from(freshSponsorMap.values())];
        }
      }
    } catch (e) {
      console.error('Error parsing stored sponsors', e);
    }
    return initialSponsors;
  });

  React.useEffect(() => {
    localStorage.setItem('sponsors', JSON.stringify(sponsors));
  }, [sponsors]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [templates] = useState<EmailTemplate[]>(mockTemplates);
  const [resources] = useState<Resource[]>(mockResources);
  const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState<KnowledgeBaseFile[]>([]);

  const updateSponsor = (id: string, data: Partial<Sponsor>) => {
    setSponsors(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const addSponsor = (sponsor: Sponsor) => {
    setSponsors(prev => [sponsor, ...prev]);
  };

  const deleteSponsor = (id: string) => {
    setSponsors(prev => prev.filter(s => s.id !== id));
  };

  const addInteraction = (interaction: Omit<Interaction, 'id'>) => {
    setInteractions(prev => [{ ...interaction, id: uuidv4() }, ...prev]);
  };

  const addKnowledgeBaseFile = (file: KnowledgeBaseFile) => {
    setKnowledgeBaseFiles(prev => [file, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, setIsAuthenticated,
      role, setRole,
      currentView, setCurrentView,
      currentUser, setCurrentUser,
      students, sponsors, interactions, templates, resources, knowledgeBaseFiles, addKnowledgeBaseFile,
      updateSponsor, deleteSponsor, addSponsor, addInteraction
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
