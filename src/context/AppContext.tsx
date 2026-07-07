import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Student, Sponsor, Interaction, EmailTemplate, Resource, KnowledgeBaseFile, ViewType, SponsorStatus } from '../types';

export type ProfileStatus = 'idle' | 'loading' | 'found' | 'not-setup' | 'error';

interface AppContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  profileStatus: ProfileStatus;
  retryLoadProfile: () => void;
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
  removeKnowledgeBaseFile: (id: string) => void;
  updateSponsor: (id: string, data: Partial<Sponsor>) => void;
  deleteSponsor: (id: string) => void;
  addSponsor: (sponsor: Sponsor) => void;
  addBulkSponsors: (newSponsors: Sponsor[]) => void;
  addInteraction: (interaction: Omit<Interaction, 'id'>) => void;
  signOut: () => Promise<void>;
  authEmail: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('loading');
  
  // Custom setter for trace
  const setProfileStatusTrace = (status: ProfileStatus) => {
    console.log(`[AppContext] setProfileStatus -> ${status}`, new Date().toISOString());
    setProfileStatus(status);
  };

  const [authSession, setAuthSession] = useState<any>(null);
  const loadAttemptRef = React.useRef(false);
  const loadedUserIdRef = React.useRef<string | null>(null);
  
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
    console.log(`[AppContext] loadData started`, new Date().toISOString());
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
          has_new_reply: s.has_new_reply,
          last_reply_at: s.last_reply_at,
          lastContactedAt: s.last_contacted_at,
          nextFollowupDate: s.next_followup_date,
          archived: s.archived,
          archivedFromStatus: s.archived_from_status,
          createdAt: s.created_at,
          country: s.country,
          submissionDate: s.submission_date,
          enrolmentDate: s.enrolment_date,
          trainingCompleted: s.training_completed,
          certificateDate: s.certificate_date
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
        let loadedTemplates = tempsRes.data.map((t: any) => ({ ...t }));
        
        // Ensure the CFT Diploma Scholarship template exists
        if (!loadedTemplates.some((t: any) => t.title === 'CFT Diploma Scholarship')) {
          loadedTemplates.push({
            id: 'cft-diploma-scholarship-template',
            title: 'CFT Diploma Scholarship',
            category: 'general',
            subject: 'Climate Friendly Travel Diploma Scholarship for {country}',
            body: `Dear [Name],

I hope you are well. I am [Role] at SUNx Malta.

We are giving a Climate Friendly Travel (CFT) Diploma scholarship for {country} starting in September and I'm hoping that you can recommend someone that would benefit.

Interested candidates should apply via [CFT Diploma Scholarships 2026](https://www.thesunprogram.com/climate-friendly-travel-diploma-scholarships).

Candidates must be able to commit to a minimum of 4-hours per week for the 8-month lecture course, and a second-year internship setting up a CFT Chapter (the internship is designed to fit with existing work commitments).

We are already developing a Climate Friendly Travel community in {country} which is led by …………, who has already completed the Diploma. The aim is to support Tourism business through our CFT Registry, and to offer potential Climate Champions access to free training.

Please let me know if you have any questions about the scholarship as we would welcome your help finding the right person.

Best wishes,`,
            active: true
          });
        }

        setTemplates(loadedTemplates);
        
        // One-off migration for the Registry template
        const registryTemplate = loadedTemplates.find((t: any) => t.body && t.body.includes("Listed on our public map and on the UN's Global Climate Action Portal."));
        if (registryTemplate && registryTemplate.id !== 'cft-diploma-scholarship-template') {
          const newBody = registryTemplate.body.replace(
            "Listed on our public map and on the UN's Global Climate Action Portal.",
            "Listed on our public map, the Travel & Tourism entry point to the UNFCCC Global Climate Action Portal"
          );
          supabase.from('templates').update({ body: newBody }).eq('id', registryTemplate.id).then();
        }

        // Update CFT Diploma Scholarship template if it's the old version
        const scholarshipTemplate = loadedTemplates.find((t: any) => t.title === 'CFT Diploma Scholarship');
        if (scholarshipTemplate) {
          const newBody = `Dear [Name],

I hope you are well. I am [Role] at SUNx Malta.

We are giving a Climate Friendly Travel (CFT) Diploma scholarship for {country} starting in September and I'm hoping that you can recommend someone that would benefit.

Interested candidates should apply via [CFT Diploma Scholarships 2026](https://www.thesunprogram.com/climate-friendly-travel-diploma-scholarships).

Candidates must be able to commit to a minimum of 4-hours per week for the 8-month lecture course, and a second-year internship setting up a CFT Chapter (the internship is designed to fit with existing work commitments).

We are already developing a Climate Friendly Travel community in {country} which is led by …………, who has already completed the Diploma. The aim is to support Tourism business through our CFT Registry, and to offer potential Climate Champions access to free training.

Please let me know if you have any questions about the scholarship as we would welcome your help finding the right person.

Best wishes,`;
          const newSubject = 'Climate Friendly Travel Diploma Scholarship for {country}';
          
          if (scholarshipTemplate.body !== newBody || scholarshipTemplate.subject !== newSubject) {
            supabase.from('templates').update({ body: newBody, subject: newSubject }).eq('id', scholarshipTemplate.id).then();
            scholarshipTemplate.body = newBody;
            scholarshipTemplate.subject = newSubject;
          }
        }
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

  const performLoad = async (user: any) => {
    console.log(`[AppContext] performLoad started for user`, user?.id, new Date().toISOString());
    if (!supabase) return;
    if (profileStatus === 'found' || loadAttemptRef.current) return;
    
    loadAttemptRef.current = true;
    setProfileStatusTrace('loading');
    
    let isTimeout = false;
    const timeoutId = setTimeout(() => {
      isTimeout = true;
      setProfileStatusTrace('error');
      loadAttemptRef.current = false;
    }, 12000);

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (isTimeout) return;
      clearTimeout(timeoutId);

      if (error) {
        setProfileStatusTrace('error');
        loadAttemptRef.current = false;
        return;
      }

      if (profile && profile.role) {
        setRole(profile.role === 'coordinator' ? 'coordinator' : 'student');
        
        if (profile.student_id) {
           const { data: stData } = await supabase.from('students').select('*').eq('id', profile.student_id).maybeSingle();
           if (!isTimeout && stData) { setCurrentUser(stData); }
        }
        
        if (!isTimeout) {
          await loadData(profile.student_id);
          if (!isTimeout) {
            setIsAuthenticated(true);
            setProfileStatusTrace('found');
          }
        }
      } else {
        setProfileStatusTrace('not-setup');
      }
    } catch (err) {
      if (isTimeout) return;
      clearTimeout(timeoutId);
      setProfileStatusTrace('error');
    } finally {
      if (!isTimeout) {
        loadAttemptRef.current = false;
      }
    }
  };

  const retryLoadProfile = useCallback(() => {
    if (authSession && !loadAttemptRef.current) {
      performLoad(authSession);
    }
  }, [authSession]);

  useEffect(() => {
    if (!supabase) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthSession(session.user);
        if (loadedUserIdRef.current !== session.user.id) {
          loadedUserIdRef.current = session.user.id;
          performLoad(session.user);
        }
      } else {
        setProfileStatusTrace('idle');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AppContext] onAuthStateChange event -> ${event}`, new Date().toISOString());
      if (event === 'SIGNED_IN') {
        if (session?.user) {
          setAuthSession(session.user);
          if (loadedUserIdRef.current !== session.user.id) {
            loadedUserIdRef.current = session.user.id;
            performLoad(session.user);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        loadedUserIdRef.current = null;
        setAuthSession(null);
        setIsAuthenticated(false);
        setProfileStatusTrace('idle');
        setCurrentUser(null);
        setSponsors([]);
        setInteractions([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !isAuthenticated) return;
    
    let debounceTimer: NodeJS.Timeout;
    const triggerLoad = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData('');
      }, 1500);
    };

    // Subscribe to realtime changes
    const channel = supabase.channel('schema-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, payload => {
        triggerLoad();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interactions' }, payload => {
        triggerLoad();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'templates' }, payload => {
        triggerLoad();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, payload => {
        triggerLoad();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_base_files' }, payload => {
        triggerLoad();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbound_messages' }, payload => {
        triggerLoad();
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase!.removeChannel(channel);
    };
  }, [isAuthenticated]);

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
    if (data.lastContactedAt !== undefined) mapped.last_contacted_at = data.lastContactedAt || null;
    if (data.nextFollowupDate !== undefined) mapped.next_followup_date = data.nextFollowupDate || null;
    if (data.archivedFromStatus !== undefined) mapped.archived_from_status = data.archivedFromStatus;
    if (data.submissionDate !== undefined) mapped.submission_date = data.submissionDate || null;
    if (data.enrolmentDate !== undefined) mapped.enrolment_date = data.enrolmentDate || null;
    if (data.trainingCompleted !== undefined) mapped.training_completed = data.trainingCompleted;
    if (data.certificateDate !== undefined) mapped.certificate_date = data.certificateDate || null;
    
    const cleanMapped = { ...mapped };
    delete cleanMapped.assignedStudentId;
    delete cleanMapped.contactName;
    delete cleanMapped.sourceNotes;
    delete cleanMapped.researchNotes;
    delete cleanMapped.lastContactedAt;
    delete cleanMapped.nextFollowupDate;
    delete cleanMapped.archivedFromStatus;
    delete cleanMapped.submissionDate;
    delete cleanMapped.enrolmentDate;
    delete cleanMapped.trainingCompleted;
    delete cleanMapped.certificateDate;
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
      last_contacted_at: sponsor.lastContactedAt || null,
      next_followup_date: sponsor.nextFollowupDate || null,
      created_at: sponsor.createdAt || null,
      archived: sponsor.archived || false,
      country: sponsor.country,
      submission_date: sponsor.submissionDate || null,
      enrolment_date: sponsor.enrolmentDate || null,
      training_completed: sponsor.trainingCompleted,
      certificate_date: sponsor.certificateDate || null
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
      last_contacted_at: s.lastContactedAt || null,
      next_followup_date: s.nextFollowupDate || null,
      created_at: s.createdAt || null,
      archived: s.archived || false,
      country: s.country,
      submission_date: s.submissionDate || null,
      enrolment_date: s.enrolmentDate || null,
      training_completed: s.trainingCompleted,
      certificate_date: s.certificateDate || null
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
      date: interaction.date || null,
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

  const removeKnowledgeBaseFile = (id: string) => {
    setKnowledgeBaseFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, setIsAuthenticated, profileStatus, retryLoadProfile,
      role, setRole,
      currentView, setCurrentView,
      currentUser, setCurrentUser,
      students, sponsors, interactions, templates, resources, knowledgeBaseFiles, addKnowledgeBaseFile, removeKnowledgeBaseFile,
      updateSponsor, deleteSponsor, addSponsor, addBulkSponsors, addInteraction, signOut,
      authEmail: authSession?.email || null
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
