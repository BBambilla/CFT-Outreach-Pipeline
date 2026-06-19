import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Student, Sponsor, Interaction, EmailTemplate, Resource, KnowledgeBaseFile, ViewType, SponsorStatus } from '../types';

interface AppContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  isLoading: boolean;
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
  addBulkSponsors: (newSponsors: Sponsor[]) => void;
  addInteraction: (interaction: Omit<Interaction, 'id'>) => void;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<'student' | 'coordinator'>('student');
  const [currentView, setCurrentView] = useState<ViewType>('pipeline');
  const [currentUser, setCurrentUser] = useState<Student | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState<KnowledgeBaseFile[]>([]);

  // Fetch students unconditionally for the login dropdown
  useEffect(() => {
    if (!supabase) return;
    const fetchStudents = async () => {
      const { data } = await supabase.from('students').select('*');
      if (data) {
        setStudents(data.map((s: any) => ({
          ...s,
        })));
      }
    };
    fetchStudents();
  }, []);

  const loadData = useCallback(async (linkedStudentId: string) => {
    if (!supabase) return;
    try {
      const [sponsorsRes, interRes, tempsRes, resRes, kbRes] = await Promise.all([
        supabase.from('sponsors').select('*'),
        supabase.from('interactions').select('*'),
        supabase.from('templates').select('*'),
        supabase.from('resources').select('*'),
        supabase.from('knowledge_base_files').select('*')
      ]);

      if (sponsorsRes.data) {
        setSponsors(sponsorsRes.data.map((s: any) => ({
          id: s.id,
          assignedStudentId: s.assigned_student_id,
          organization: s.organization,
          contactName: s.contact_name,
          role: s.role,
          email: s.email,
          phone: s.phone,
          website: s.website,
          rationale: s.rationale,
          sourceNotes: s.source_notes,
          classification: s.classification,
          researchNotes: s.research_notes,
          status: s.status,
          priority: s.priority,
          lastContactedAt: s.last_contacted_at,
          nextFollowupDate: s.next_followup_date,
          archived: s.archived,
          createdAt: s.created_at
        })));
      }

      if (interRes.data) {
        setInteractions(interRes.data.map((i: any) => ({
          id: i.id,
          sponsorId: i.sponsor_id,
          type: i.type,
          date: i.date,
          summary: i.summary,
          attachment: i.attachment,
          outcome: i.outcome
        })));
      }

      if (tempsRes.data) {
        setTemplates(tempsRes.data.map((t: any) => ({ ...t })));
      }
      
      if (resRes.data) {
        setResources(resRes.data.map((r: any) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          tags: r.tags || [],
          pinned: r.pinned,
          requiredReading: r.required_reading ?? r.requiredReading
        })));
      }
      
      if (kbRes.data) {
        setKnowledgeBaseFiles(kbRes.data.map((k: any) => ({
          id: k.id,
          title: k.title,
          url: k.url,
          uploadedAt: k.uploaded_at || k.uploadedAt,
          size: k.size,
          type: k.type
        })));
      }

    } catch (err) {
      console.error('Failed to load data from Supabase', err);
    }
  }, []);

  const handleUserSignIn = useCallback(async (user: any) => {
    if (!supabase) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        setRole(profile.role === 'coordinator' ? 'coordinator' : 'student');
        
        // Find matching student object right away if we have students loaded
        if (profile.student_id) {
           const { data: stData } = await supabase.from('students').select('*').eq('id', profile.student_id).single();
           if (stData) { setCurrentUser(stData); }
        }
        
        await loadData(profile.student_id);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);

  useEffect(() => {
    if (!supabase) return;
    
    setIsLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserSignIn(session.user);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUserSignIn(session.user);
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
        setCurrentUser(null);
        setSponsors([]);
        setInteractions([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleUserSignIn]);

  useEffect(() => {
    if (!supabase || !isAuthenticated) return;
    
    // Subscribe to realtime changes
    const channel = supabase.channel('schema-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, payload => {
        loadData(currentUser?.id || '');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interactions' }, payload => {
        loadData(currentUser?.id || '');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'templates' }, payload => {
        loadData(currentUser?.id || '');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, payload => {
        loadData(currentUser?.id || '');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_base_files' }, payload => {
        loadData(currentUser?.id || '');
      })
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [isAuthenticated, currentUser?.id, loadData]);

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const updateSponsor = async (id: string, data: Partial<Sponsor>) => {
    if (!supabase) return;
    // Optimistic
    setSponsors(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    const mapped: any = { ...data };
    if (data.assignedStudentId !== undefined) mapped.assigned_student_id = data.assignedStudentId;
    if (data.contactName !== undefined) mapped.contact_name = data.contactName;
    if (data.sourceNotes !== undefined) mapped.source_notes = data.sourceNotes;
    if (data.researchNotes !== undefined) mapped.research_notes = data.researchNotes;
    if (data.lastContactedAt !== undefined) mapped.last_contacted_at = data.lastContactedAt;
    if (data.nextFollowupDate !== undefined) mapped.next_followup_date = data.nextFollowupDate;
    
    const cleanMapped = { ...mapped };
    delete cleanMapped.assignedStudentId;
    delete cleanMapped.contactName;
    delete cleanMapped.sourceNotes;
    delete cleanMapped.researchNotes;
    delete cleanMapped.lastContactedAt;
    delete cleanMapped.nextFollowupDate;
    delete cleanMapped.createdAt;
    
    const { error } = await supabase.from('sponsors').update(cleanMapped).eq('id', id);
    if (error) {
       console.error(error);
       alert('Failed to update sponsor');
       loadData(currentUser?.id || '');
    }
  };

  const addSponsor = async (sponsor: Sponsor) => {
    if (!supabase) return;
    setSponsors(prev => [sponsor, ...prev]);
    const { data: _, error } = await supabase.from('sponsors').insert([{
      id: sponsor.id,
      assigned_student_id: sponsor.assignedStudentId,
      organization: sponsor.organization,
      contact_name: sponsor.contactName,
      role: sponsor.role,
      email: sponsor.email,
      phone: sponsor.phone,
      website: sponsor.website,
      rationale: sponsor.rationale,
      source_notes: sponsor.sourceNotes,
      classification: sponsor.classification,
      research_notes: sponsor.researchNotes,
      status: sponsor.status,
      priority: sponsor.priority,
      last_contacted_at: sponsor.lastContactedAt,
      next_followup_date: sponsor.nextFollowupDate,
      created_at: sponsor.createdAt,
      archived: sponsor.archived || false
    }]);
    if (error) {
      console.error(error);
      alert('Failed to add sponsor');
      loadData(currentUser?.id || '');
    }
  };

  const addBulkSponsors = async (newSponsors: Sponsor[]) => {
    if (!supabase) return;
    setSponsors(prev => [...newSponsors, ...prev]);
    const insertData = newSponsors.map(s => ({
      id: s.id,
      assigned_student_id: s.assignedStudentId,
      organization: s.organization,
      contact_name: s.contactName,
      role: s.role,
      email: s.email,
      phone: s.phone,
      website: s.website,
      rationale: s.rationale,
      source_notes: s.sourceNotes,
      classification: s.classification,
      research_notes: s.researchNotes,
      status: s.status,
      priority: s.priority,
      last_contacted_at: s.lastContactedAt,
      next_followup_date: s.nextFollowupDate,
      created_at: s.createdAt,
      archived: s.archived || false
    }));
    await supabase.from('sponsors').insert(insertData);
  };

  const deleteSponsor = async (id: string) => {
    if (!supabase) return;
    setSponsors(prev => prev.filter(s => s.id !== id));
    const { error } = await supabase.from('sponsors').delete().eq('id', id);
    if (error) {
      console.error(error);
      alert('Failed to delete');
      loadData(currentUser?.id || '');
    }
  };

  const addInteraction = async (interaction: Omit<Interaction, 'id'>) => {
    if (!supabase) return;
    const newId = crypto.randomUUID();
    const newInter = { ...interaction, id: newId };
    setInteractions(prev => [newInter, ...prev]);
    const { error } = await supabase.from('interactions').insert([{
      id: newId,
      sponsor_id: interaction.sponsorId,
      type: interaction.type,
      date: interaction.date,
      summary: interaction.summary,
      attachment: interaction.attachment,
      outcome: interaction.outcome
    }]);
    if (error) {
      console.error(error);
      alert('Failed to add interaction');
      loadData(currentUser?.id || '');
    }
  };

  const addKnowledgeBaseFile = async (file: KnowledgeBaseFile) => {
    if (!supabase) return;
    setKnowledgeBaseFiles(prev => [file, ...prev]);
    await supabase.from('knowledge_base_files').insert([{
      id: file.id,
      title: file.title,
      url: file.url,
      uploaded_at: file.uploadedAt,
      size: file.size,
      type: file.type
    }]);
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, setIsAuthenticated, isLoading,
      role, setRole,
      currentView, setCurrentView,
      currentUser, setCurrentUser,
      students, sponsors, interactions, templates, resources, knowledgeBaseFiles, addKnowledgeBaseFile,
      updateSponsor, deleteSponsor, addSponsor, addBulkSponsors, addInteraction, signOut
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
