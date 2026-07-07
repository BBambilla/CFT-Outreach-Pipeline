import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { PILELINE_STATUSES, Sponsor, SupportRequest } from '../types';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Mail, AlertTriangle, Clock, Trophy, Users, Plus, KanbanSquare, LayoutDashboard, ShieldAlert, Upload, MessageCircle, List, Search, Filter, CalendarDays, Users2, Flag, ArrowUpDown, Map } from 'lucide-react';
import { BulkEmailTab } from './BulkEmailTab';
import { AddLeadModal } from './AddLeadModal';
import { KanbanBoard } from './KanbanBoard';
import { SponsorDetailModal } from './SponsorDetailModal';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

export const CoordinatorDashboard: React.FC = () => {
  const { sponsors, students, addBulkSponsors, authEmail } = useAppContext();
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [view, setView] = useState<'overview' | 'leads' | 'pipeline' | 'reps' | 'followups' | 'admin' | 'bulk-email'>('overview');
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSupportRequests = async () => {
      const { data, error } = await supabase
        .from('support_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        const sorted = data.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setSupportRequests(sorted);
      }
    };
    
    fetchSupportRequests();

    // Set up realtime subscription
    const subscription = supabase.channel('support_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_requests' }, payload => {
        fetchSupportRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const toggleSupportRequestStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'actioned' : 'pending';
    const { error } = await supabase.from('support_requests').update({ status: newStatus }).eq('id', id);
    if (error) {
      console.error('Failed to update status', error);
      alert('Failed to update request status');
    }
  };

  const handleSupportRequestDrop = async (e: React.DragEvent, targetStatus: 'pending' | 'actioned') => {
    e.preventDefault();
    const id = e.dataTransfer.getData('supportRequestId');
    if (!id) return;
    const req = supportRequests.find(r => r.id === id);
    if (req && req.status !== targetStatus) {
      await toggleSupportRequestStatus(id, req.status);
    }
  };

  const handleExportSupabase = async () => {
    try {
      const { loadInitialData } = await import('../data/initialData');
      const data = loadInitialData();
      
      const unparseOpts = { quotes: true, header: true };

      // 1) Export students
      const studentsCsvStr = Papa.unparse(data.initialStudents.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        country: s.country,
        continent: s.continent
      })), unparseOpts);
      
      const studentsBlob = new Blob([studentsCsvStr], { type: 'text/csv;charset=utf-8;' });
      const studentsLink = document.createElement('a');
      studentsLink.href = URL.createObjectURL(studentsBlob);
      studentsLink.download = 'students.csv';
      studentsLink.click();

      // 2) Export sponsors (leads)
      const sponsorsCsvStr = Papa.unparse(data.initialSponsors.map(s => ({
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
        research_notes: s.researchNotes,
        status: s.status,
        priority: s.priority
      })), unparseOpts);

      const sponsorsBlob = new Blob([sponsorsCsvStr], { type: 'text/csv;charset=utf-8;' });
      const sponsorsLink = document.createElement('a');
      sponsorsLink.href = URL.createObjectURL(sponsorsBlob);
      sponsorsLink.download = 'sponsors.csv';
      sponsorsLink.click();

    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export data');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        const newSponsors: Sponsor[] = data.map(row => {
          let orgName = row['Organisation'] || row['Organization'] || row['Name'] || 'Unknown Organization';
          
          return {
            id: uuidv4(),
            organization: orgName,
            status: 'To Research',
            contactName: row['First Name'] ? `${row['First Name']} ${row['Surname'] || ''}`.trim() : (row['Contact Name'] || ''),
            role: row['Title'] || row['Role'] || '',
            email: row['Email'] || '',
            phone: row['Telephone'] || row['Phone'] || '',
            website: row['Website'] || '',
            classification: 'Sponsorships',
            assignedStudentId: view === 'admin' ? 'student-admin' : 'unassigned',
            rationale: row['Notes'] || '',
            sourceNotes: '',
            researchNotes: '',
            priority: 'Medium',
            createdAt: new Date().toISOString()
          };
        });

        if (newSponsors.length > 0) {
          addBulkSponsors(newSponsors);
        }
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
      }
    });
  };

  // Active sponsors for the board
  const activeSponsors = sponsors.filter(s => !s.archived);
  const archivedSponsors = sponsors.filter(s => s.archived);

  const adminSponsors = activeSponsors.filter(s => s.assignedStudentId === 'student-admin');
  const adminArchivedSponsors = archivedSponsors.filter(s => s.assignedStudentId === 'student-admin');

  const activeRegistryTraining = useMemo(() => {
    return activeSponsors.filter(s => s.classification === 'Registry' || s.classification === 'CFT Training' || s.classification === 'Scholarships');
  }, [activeSponsors]);

  const archivedSponsorshipCount = useMemo(() => {
    return sponsors.filter(s => s.archived && s.classification === 'Sponsorships').length;
  }, [sponsors]);

  const archivedScholarshipsCount = useMemo(() => {
    return sponsors.filter(s => s.archived && s.classification === 'Scholarships').length;
  }, [sponsors]);

  const getRepInfo = (studentId: string) => {
    if (studentId === 'student-admin' || !studentId) return { name: '-', country: '-' };
    const student = students.find(s => s.id === studentId);
    return student ? { name: student.name, country: student.country } : { name: '-', country: '-' };
  };

  const overviewStats = useMemo(() => {
    let registryCount = 0;
    let cftCount = 0;
    let scholarshipsCount = 0;
    let committed = 0;
    let registered = 0;
    const stuckThreshold = new Date(Date.now() - 10 * 86400000);
    let stuckCount = 0;
    const stuckLeadsList: Sponsor[] = [];
    const wins: Sponsor[] = [];

    activeRegistryTraining.forEach(s => {
      if (s.classification === 'Registry') registryCount++;
      if (s.classification === 'CFT Training') cftCount++;
      if (s.classification === 'Scholarships') scholarshipsCount++;
      if (s.status === 'Committed') {
        committed++;
        wins.push(s);
      }
      if (s.status === 'Registered / Enrolled') {
        registered++;
        wins.push(s);
      }
      
      if (s.status !== 'Committed' && s.status !== 'Registered / Enrolled' && s.status !== 'Declined') {
        const lastActive = s.lastContactedAt ? new Date(s.lastContactedAt) : new Date(s.createdAt);
        if (lastActive < stuckThreshold) {
          stuckCount++;
          stuckLeadsList.push(s);
        }
      }
    });

    wins.sort((a, b) => {
      const aTime = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : new Date(a.createdAt).getTime();
      const bTime = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    stuckLeadsList.sort((a, b) => {
      const aTime = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : new Date(a.createdAt).getTime();
      const bTime = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : new Date(b.createdAt).getTime();
      return aTime - bTime; // oldest first
    });

    return { total: activeRegistryTraining.length, registryCount, cftCount, scholarshipsCount, committed, registered, stuckCount, stuckLeadsList, wins };
  }, [activeRegistryTraining]);

  const funnelData = useMemo(() => {
    return PILELINE_STATUSES.map(status => ({
      name: status,
      count: activeRegistryTraining.filter(s => s.status === status).length
    }));
  }, [activeRegistryTraining]);

  const donutData = [
    { name: 'Registry', value: overviewStats.registryCount },
    { name: 'CFT Training', value: overviewStats.cftCount },
    { name: 'Scholarships', value: overviewStats.scholarshipsCount }
  ];
  const COLORS = ['#E4531F', '#0EA5E9', '#f59e0b'];

  // Table filters
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCountry, setFilterCountry] = useState<string>('All');
  const [filterRep, setFilterRep] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads = useMemo(() => {
    return activeRegistryTraining.filter(s => {
      const repInfo = getRepInfo(s.assignedStudentId);
      
      if (filterType !== 'All' && s.classification !== filterType) return false;
      if (filterStatus !== 'All' && s.status !== filterStatus) return false;
      if (filterCountry !== 'All' && filterCountry !== 'Unassigned/Admin' && repInfo.country !== filterCountry) return false;
      if (filterCountry === 'Unassigned/Admin' && repInfo.country !== '-') return false;
      if (filterRep !== 'All' && filterRep !== 'Unassigned/Admin' && repInfo.name !== filterRep) return false;
      if (filterRep === 'Unassigned/Admin' && repInfo.name !== '-') return false;
      if (filterPriority !== 'All' && s.priority !== filterPriority) return false;
      
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        if (!s.organization.toLowerCase().includes(sq) && !(s.contactName || '').toLowerCase().includes(sq)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      // sort by next follow up closest first
      if (!a.nextFollowupDate) return 1;
      if (!b.nextFollowupDate) return -1;
      return new Date(a.nextFollowupDate).getTime() - new Date(b.nextFollowupDate).getTime();
    });
  }, [activeRegistryTraining, filterType, filterStatus, filterCountry, filterRep, filterPriority, searchQuery, students]);

  // Unique lists for filters
  const uniqueCountries = useMemo(() => {
    const list = new Set<string>();
    activeRegistryTraining.forEach(s => {
      const info = getRepInfo(s.assignedStudentId);
      if (info.country !== '-') list.add(info.country);
    });
    return Array.from(list).sort();
  }, [activeRegistryTraining, students]);


  const repStats = useMemo(() => {
    const stats: Record<string, { repName: string, country: string, total: number, contactedPlus: number, committed: number, registered: number, stuck: number, lastActivity: number }> = {};
    
    students.forEach(st => {
      stats[st.id] = { repName: st.name, country: st.country, total: 0, contactedPlus: 0, committed: 0, registered: 0, stuck: 0, lastActivity: 0 };
    });

    const now = Date.now();
    const stuckThreshold = now - 10 * 86400000;

    activeRegistryTraining.forEach(s => {
      const repId = s.assignedStudentId;
      if (!repId || repId === 'student-admin') return;
      if (!stats[repId]) return;

      stats[repId].total++;
      if (s.status !== 'Not Contacted') {
        stats[repId].contactedPlus++;
      }
      if (s.status === 'Committed') stats[repId].committed++;
      if (s.status === 'Registered / Enrolled') stats[repId].registered++;
      
      const lastActive = s.lastContactedAt ? new Date(s.lastContactedAt).getTime() : new Date(s.createdAt).getTime();
      if (lastActive > stats[repId].lastActivity) {
        stats[repId].lastActivity = lastActive;
      }
      
      if (s.status !== 'Committed' && s.status !== 'Registered / Enrolled' && s.status !== 'Declined') {
        if (lastActive < stuckThreshold) {
          stats[repId].stuck++;
        }
      }
    });

    return Object.values(stats).filter(s => s.total > 0 || s.lastActivity > 0).sort((a, b) => b.total - a.total);
  }, [activeRegistryTraining, students]);

  const countryStats = useMemo(() => {
    const stats: Record<string, { country: string, reps: number, total: number, contactedPlus: number, committed: number, registered: number, stuck: number, lastActivity: number }> = {};
    
    repStats.forEach(rs => {
      if (!stats[rs.country]) {
        stats[rs.country] = { country: rs.country, reps: 0, total: 0, contactedPlus: 0, committed: 0, registered: 0, stuck: 0, lastActivity: 0 };
      }
      stats[rs.country].reps++;
      stats[rs.country].total += rs.total;
      stats[rs.country].contactedPlus += rs.contactedPlus;
      stats[rs.country].committed += rs.committed;
      stats[rs.country].registered += rs.registered;
      stats[rs.country].stuck += rs.stuck;
      if (rs.lastActivity > stats[rs.country].lastActivity) {
        stats[rs.country].lastActivity = rs.lastActivity;
      }
    });
    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [repStats]);

  const [repSort, setRepSort] = useState<{field: string, dir: 'asc'|'desc'}>({field: 'total', dir: 'desc'});
  const [repViewType, setRepViewType] = useState<'reps' | 'countries'>('reps');

  const sortedRepStats = useMemo(() => {
    return [...repStats].sort((a, b) => {
      const aVal = a[repSort.field as keyof typeof a];
      const bVal = b[repSort.field as keyof typeof b];
      if (aVal < bVal) return repSort.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return repSort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [repStats, repSort]);

  const sortedCountryStats = useMemo(() => {
    return [...countryStats].sort((a, b) => {
      const aVal = a[repSort.field as keyof typeof a] || 0;
      const bVal = b[repSort.field as keyof typeof b] || 0;
      if (aVal < bVal) return repSort.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return repSort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [countryStats, repSort]);

  const followups = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const dueTodayOrOverdue: typeof activeRegistryTraining = [];
    const dueThisWeek: typeof activeRegistryTraining = [];

    activeRegistryTraining.forEach(s => {
      if (!s.nextFollowupDate) return;
      if (s.status === 'Committed' || s.status === 'Registered / Enrolled' || s.status === 'Declined') return;

      const d = new Date(s.nextFollowupDate);
      d.setHours(0,0,0,0);
      
      if (d.getTime() <= today.getTime()) {
        dueTodayOrOverdue.push(s);
      } else if (d.getTime() < nextWeek.getTime()) {
        dueThisWeek.push(s);
      }
    });

    dueTodayOrOverdue.sort((a, b) => new Date(a.nextFollowupDate).getTime() - new Date(b.nextFollowupDate).getTime());
    dueThisWeek.sort((a, b) => new Date(a.nextFollowupDate).getTime() - new Date(b.nextFollowupDate).getTime());

    return { dueTodayOrOverdue, dueThisWeek };
  }, [activeRegistryTraining]);

  const handleRepSort = (field: string) => {
    if (repSort.field === field) {
      setRepSort({ field, dir: repSort.dir === 'asc' ? 'desc' : 'asc' });
    } else {
      setRepSort({ field, dir: 'desc' });
    }
  };

  const uniqueReps = useMemo(() => {
    const list = new Set<string>();
    activeRegistryTraining.forEach(s => {
      const info = getRepInfo(s.assignedStudentId);
      if (info.name !== '-') list.add(info.name);
    });
    return Array.from(list).sort();
  }, [activeRegistryTraining, students]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Coordinator Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of all student pipelines, global leads, and administrative tools.</p>
        </div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
            <button
              onClick={() => setView('reps')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'reps' ? 'bg-white text-brand-orange shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Users2 size={16} />
              Reps & Countries
            </button>
            <button
              onClick={() => setView('followups')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'followups' ? 'bg-white text-brand-orange shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <CalendarDays size={16} />
              Follow-ups Due
            </button>
            <button
              onClick={() => setView('overview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'overview' ? 'bg-white text-brand-orange shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <LayoutDashboard size={16} />
              Overview
            </button>
            <button
              onClick={() => setView('leads')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'leads' ? 'bg-white text-brand-orange shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <List size={16} />
              Leads
            </button>
            <button
              onClick={() => setView('pipeline')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'pipeline' ? 'bg-white text-brand-orange shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <KanbanSquare size={16} />
              Global Pipeline
            </button>
            <button
              onClick={() => setView('admin')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'admin' ? 'bg-white text-brand-orange shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <ShieldAlert size={16} />
              Admin Leads
            </button>
            {(authEmail === 'olly@cft-app.local' || authEmail === 'chapters@thesunprogram.com' || authEmail === 'pratishtha@cft-app.local') && (
              <button
                onClick={() => setView('bulk-email')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'bulk-email' ? 'bg-white text-brand-orange shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Mail size={16} />
                Bulk Email
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleExportSupabase}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors shadow-sm"
              title="Download initial data for Supabase"
            >
              <Upload size={16} className="rotate-180" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
              title="Upload CSV to current view"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Upload CSV</span>
            </button>
            <button 
              onClick={() => setIsAddingLead(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>New Lead</span>
            </button>
          </div>
        </div>
      </div>

      {supportRequests.length > 0 && (() => {
        const pendingRequests = supportRequests.filter(r => r.status === 'pending');
        const actionedRequests = supportRequests.filter(r => r.status === 'actioned');

        return (
          <div className="mb-8 flex flex-col gap-6">
            <div 
              className="bg-white border-2 border-brand-orange/20 rounded-xl shadow-md shadow-brand-orange/5 overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleSupportRequestDrop(e, 'pending')}
            >
              <div className="px-6 py-4 border-b border-brand-orange/20 bg-orange-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold font-heading text-orange-900 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-brand-orange" />
                  Pending Support Requests
                  <span className="ml-3 bg-brand-orange text-white text-xs py-0.5 px-2.5 rounded-full font-bold">
                    {pendingRequests.length}
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto min-h-[100px]">
                {pendingRequests.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center justify-center h-full">
                    No pending support requests.
                  </div>
                ) : (
                  pendingRequests.map(req => (
                    <div 
                      key={req.id} 
                      className="p-5 hover:bg-slate-50/50 transition-colors cursor-move"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('supportRequestId', req.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-800 text-base">{req.subject}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-yellow/20 text-yellow-700">
                              Pending
                            </span>
                            {req.category && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                {req.category}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-slate-600 mt-1">
                            {req.rep_name} <span className="text-slate-300 mx-1">•</span> <span className="text-brand-blue">{req.country}</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs text-slate-500 font-mono bg-white border border-slate-200 shadow-sm px-2 py-1 rounded-md">
                            {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <button 
                            onClick={() => toggleSupportRequestStatus(req.id, req.status)}
                            className="text-xs px-2.5 py-1 rounded-md border font-medium transition-colors bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          >
                            Mark as actioned
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap mt-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">{req.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div 
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleSupportRequestDrop(e, 'actioned')}
            >
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="text-lg font-bold font-heading text-slate-700 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-slate-400" />
                  Actioned Support Requests
                  <span className="ml-3 bg-slate-200 text-slate-600 text-xs py-0.5 px-2.5 rounded-full font-bold">
                    {actionedRequests.length}
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto min-h-[100px]">
                {actionedRequests.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center justify-center h-full">
                    No actioned support requests.
                  </div>
                ) : (
                  actionedRequests.map(req => (
                    <div 
                      key={req.id} 
                      className="p-5 hover:bg-slate-50/50 transition-colors cursor-move"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('supportRequestId', req.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-800 text-base">{req.subject}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              Actioned
                            </span>
                            {req.category && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                {req.category}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-slate-600 mt-1">
                            {req.rep_name} <span className="text-slate-300 mx-1">•</span> <span className="text-brand-blue">{req.country}</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs text-slate-500 font-mono bg-white border border-slate-200 shadow-sm px-2 py-1 rounded-md">
                            {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <button 
                            onClick={() => toggleSupportRequestStatus(req.id, req.status)}
                            className="text-xs px-2.5 py-1 rounded-md border font-medium transition-colors bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                          >
                            Mark as pending
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap mt-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">{req.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {view === 'overview' ? (
        <div className="space-y-8 mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-white border text-center border-slate-200 p-4 rounded-xl shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Active</p>
              <p className="text-3xl font-bold text-slate-900">{overviewStats.total}</p>
            </div>
            <div className="bg-white border text-center border-slate-200 p-4 rounded-xl shadow-sm border-b-4 border-b-brand-orange">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Registry</p>
              <p className="text-3xl font-bold text-brand-orange">{overviewStats.registryCount}</p>
            </div>
            <div className="bg-white border text-center border-slate-200 p-4 rounded-xl shadow-sm border-b-4 border-b-sky-500">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">CFT Training</p>
              <p className="text-3xl font-bold text-sky-600">{overviewStats.cftCount}</p>
            </div>
            <div className="bg-white border text-center border-slate-200 p-4 rounded-xl shadow-sm border-b-4 border-b-amber-500">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Scholarships</p>
              <p className="text-3xl font-bold text-amber-600">{overviewStats.scholarshipsCount}</p>
            </div>
            <div className="bg-white border text-center border-slate-200 p-4 rounded-xl shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Committed</p>
              <p className="text-3xl font-bold text-green-600">{overviewStats.committed}</p>
            </div>
            <div className="bg-white border text-center border-slate-200 p-4 rounded-xl shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Registered</p>
              <p className="text-3xl font-bold text-emerald-600">{overviewStats.registered}</p>
            </div>
            <div className="bg-orange-50 border text-center border-orange-200 p-4 rounded-xl shadow-sm">
              <p className="text-xs font-semibold text-orange-800 uppercase tracking-wider mb-1">Stuck (+10d)</p>
              <p className="text-3xl font-bold text-brand-orange">{overviewStats.stuckCount}</p>
            </div>
            <div className="bg-slate-50 border text-center border-slate-200 p-4 rounded-xl shadow-sm opacity-70">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sponsorships</p>
              <p className="text-3xl font-bold text-slate-500">{archivedSponsorshipCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-semibold font-heading text-slate-900 mb-6">Pipeline Stage</h2>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={120} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="#475569" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <h2 className="text-base font-semibold font-heading text-slate-900 mb-2">Lead Type Split</h2>
              <div className="h-[200px] w-full flex-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4 flex-wrap">
                <div className="flex items-center text-sm"><div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: COLORS[0]}}></div> Registry</div>
                <div className="flex items-center text-sm"><div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: COLORS[1]}}></div> CFT Training</div>
                <div className="flex items-center text-sm"><div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: COLORS[2]}}></div> Scholarships</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Wins */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm border-t-4 border-t-sdg-green">
              <h2 className="text-base font-semibold font-heading text-green-800 mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-sdg-green" />
                Recent Wins
              </h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {overviewStats.wins.length === 0 ? (
                  <p className="text-sm text-green-700/70">No wins yet. Keep pushing!</p>
                ) : (
                  overviewStats.wins.map(s => {
                    const info = getRepInfo(s.assignedStudentId);
                    return (
                    <div key={s.id} onClick={() => setSelectedSponsorId(s.id)} className="bg-white p-3 rounded-lg border border-green-100 shadow-sm cursor-pointer hover:border-green-300 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-green-900 block">{s.organization}</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded border border-green-200">{s.status}</span>
                      </div>
                      <p className="text-xs text-green-700">Secured by <span className="font-semibold">{info.name}</span> • {info.country}</p>
                    </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Stuck Alert */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm border-t-4 border-t-brand-orange">
              <h2 className="text-base font-semibold font-heading text-orange-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-brand-orange" />
                Needs Attention (Stuck 10+ days)
              </h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {overviewStats.stuckLeadsList.length === 0 ? (
                  <p className="text-sm text-orange-700/70">Pipeline is flowing well.</p>
                ) : (
                  overviewStats.stuckLeadsList.map(s => {
                    const info = getRepInfo(s.assignedStudentId);
                    const lastActive = s.lastContactedAt ? new Date(s.lastContactedAt) : new Date(s.createdAt);
                    return (
                      <div key={s.id} onClick={() => setSelectedSponsorId(s.id)} className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm cursor-pointer hover:border-orange-300 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-orange-900 block">{s.organization}</span>
                          <span className="text-xs text-orange-500 font-mono">{lastActive.toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-orange-700">{info.name} • {info.country} • <span className="font-medium text-orange-800">{s.status}</span></p>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : view === 'leads' ? (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative border border-slate-300 rounded-lg bg-white shadow-sm flex items-center flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 ml-3" />
                <input 
                  type="text" 
                  placeholder="Search organization or contact..." 
                  className="w-full pl-2 pr-4 py-2 bg-transparent text-sm font-medium focus:outline-none placeholder-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="All">All Types</option>
                  <option value="Registry">Registry</option>
                  <option value="CFT Training">CFT Training</option>
                  <option value="Scholarships">Scholarships</option>
                </select>
                <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="All">All Statuses</option>
                  {PILELINE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white" value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
                  <option value="All">All Countries</option>
                  <option value="Unassigned/Admin">Unassigned / Admin</option>
                  {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white" value={filterRep} onChange={(e) => setFilterRep(e.target.value)}>
                  <option value="All">All Reps</option>
                  <option value="Unassigned/Admin">Unassigned / Admin</option>
                  {uniqueReps.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500">Organization</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500">Contact</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500">Status</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500">Type</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500">Country</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500">Rep</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500">Priority</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500">Next Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">No leads match the selected criteria.</td>
                  </tr>
                ) : (
                  filteredLeads.map(s => {
                    const info = getRepInfo(s.assignedStudentId);
                    return (
                      <tr key={s.id} onClick={() => setSelectedSponsorId(s.id)} className="hover:bg-slate-50/70 transition-colors cursor-pointer group">
                        <td className="px-4 py-3 font-medium text-slate-900 group-hover:text-brand-orange transition-colors">{s.organization}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{s.contactName || '-'}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{s.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                           {s.classification === 'Registry' ? (
                              <span className="text-brand-orange font-medium">{s.classification}</span>
                           ) : s.classification === 'CFT Training' ? (
                              <span className="text-sky-600 font-medium">{s.classification}</span>
                           ) : s.classification === 'Scholarships' ? (
                              <span className="text-amber-600 font-medium">{s.classification}</span>
                           ) : s.classification === 'Sponsorships' ? (
                              <span className="text-purple-600 font-medium">{s.classification}</span>
                           ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{info.country}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{info.name}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            s.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' :
                            s.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {s.priority || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 font-mono whitespace-nowrap">{s.nextFollowupDate ? new Date(s.nextFollowupDate).toLocaleDateString() : '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      ) : view === 'reps' ? (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-base font-semibold text-slate-900 flex items-center">
              <Users2 className="w-5 h-5 mr-2 text-brand-blue" />
              Rep & Country Leaderboard
            </h2>
            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              <button onClick={() => setRepViewType('reps')} className={`px-3 py-1 text-sm font-medium rounded ${repViewType === 'reps' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Reps</button>
              <button onClick={() => setRepViewType('countries')} className={`px-3 py-1 text-sm font-medium rounded ${repViewType === 'countries' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Countries</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th onClick={() => handleRepSort(repViewType === 'reps' ? 'repName' : 'country')} className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">
                    {repViewType === 'reps' ? 'Rep' : 'Country'} <ArrowUpDown className="w-3 h-3 inline ml-1" />
                  </th>
                  {repViewType === 'reps' && <th onClick={() => handleRepSort('country')} className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">Country <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>}
                  {repViewType === 'countries' && <th onClick={() => handleRepSort('reps')} className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">Reps <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>}
                  <th onClick={() => handleRepSort('total')} className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">Total Leads <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                  <th onClick={() => handleRepSort('contactedPlus')} className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">Contacted+ <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                  <th onClick={() => handleRepSort('committed')} className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">Committed <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                  <th onClick={() => handleRepSort('registered')} className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">Reg/Enrolled <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                  <th onClick={() => handleRepSort('stuck')} className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">Stuck (+10d) <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                  <th onClick={() => handleRepSort('lastActivity')} className="px-4 py-3 font-semibold tracking-wider text-xs uppercase text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">Last Activity <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(repViewType === 'reps' ? sortedRepStats : sortedCountryStats).map((row, i) => {
                  const isZeroAction = row.total > 0 && row.contactedPlus === 0;
                  const isHighStuck = row.total > 0 && row.stuck > row.total / 2;
                  const warning = isZeroAction ? "Zero action taken" : isHighStuck ? "Many stuck leads" : null;
                  return (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 border-l-4" style={{ borderLeftColor: warning ? '#f97316' : 'transparent' }}>
                        {'repName' in row ? row.repName : row.country}
                        {warning && <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full inline-flex items-center"><Flag className="w-3 h-3 mr-1"/>{warning}</span>}
                      </td>
                      {'country' in row && repViewType === 'reps' && <td className="px-4 py-3 text-sm text-slate-600">{'repName' in row ? row.country : ''}</td>}
                      {'reps' in row && repViewType === 'countries' && <td className="px-4 py-3 text-sm text-slate-600">{row.reps}</td>}
                      <td className="px-4 py-3 text-sm text-slate-700 font-medium">{row.total}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.contactedPlus}</td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium">{row.committed}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{row.registered}</td>
                      <td className="px-4 py-3 text-sm text-orange-600 font-medium">{row.stuck}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono">{row.lastActivity ? new Date(row.lastActivity).toLocaleDateString() : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : view === 'followups' ? (
        <div className="mt-8 space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-red-100 bg-red-50/50 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-3 text-red-600" />
              <h2 className="text-base font-semibold text-red-900">Today / Overdue Actions</h2>
              <span className="ml-3 bg-red-100 text-red-800 text-xs py-0.5 px-2.5 rounded-full font-bold">{followups.dueTodayOrOverdue.length}</span>
            </div>
            {followups.dueTodayOrOverdue.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No follow-ups due today.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {followups.dueTodayOrOverdue.map(s => {
                  const info = getRepInfo(s.assignedStudentId);
                  return (
                    <div key={s.id} onClick={() => setSelectedSponsorId(s.id)} className="p-4 hover:bg-slate-50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">{s.organization}</span>
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">{s.status}</span>
                        </div>
                        <p className="text-sm text-slate-600">{info.name} • {info.country}</p>
                      </div>
                      <div className="flex items-center text-red-600 font-mono text-sm bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 min-w-[max-content]">
                        <Clock className="w-4 h-4 mr-2" />
                        Due: {new Date(s.nextFollowupDate!).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col opacity-90">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center">
              <CalendarDays className="w-5 h-5 mr-3 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Upcoming This Week</h2>
              <span className="ml-3 bg-slate-200 text-slate-700 text-xs py-0.5 px-2.5 rounded-full font-bold">{followups.dueThisWeek.length}</span>
            </div>
            {followups.dueThisWeek.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No upcoming follow-ups this week.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {followups.dueThisWeek.map(s => {
                  const info = getRepInfo(s.assignedStudentId);
                  return (
                    <div key={s.id} onClick={() => setSelectedSponsorId(s.id)} className="p-4 hover:bg-slate-50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">{s.organization}</span>
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">{s.status}</span>
                        </div>
                        <p className="text-sm text-slate-600">{info.name} • {info.country}</p>
                      </div>
                      <div className="flex items-center text-slate-600 font-mono text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 min-w-[max-content]">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        Due: {new Date(s.nextFollowupDate!).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : view === 'pipeline' ? (
        <div className="mt-8 flex-1 w-full bg-slate-50 border shadow-inner overflow-x-auto border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 -mx-4 sm:-mx-6 lg:-mx-8 min-h-[500px]">
          <KanbanBoard sponsors={activeSponsors} archivedSponsors={archivedSponsors} onSponsorClick={setSelectedSponsorId} />
        </div>
      ) : view === 'bulk-email' ? (
        <BulkEmailTab />
      ) : (
        <div className="mt-8 flex-1 w-full bg-slate-50 border shadow-inner overflow-x-auto border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 -mx-4 sm:-mx-6 lg:-mx-8 min-h-[500px]">
          <KanbanBoard sponsors={adminSponsors} archivedSponsors={adminArchivedSponsors} onSponsorClick={setSelectedSponsorId} />
        </div>
      )}
      
      {isAddingLead && <AddLeadModal onClose={() => setIsAddingLead(false)} />}
      {selectedSponsorId && <SponsorDetailModal sponsorId={selectedSponsorId} onClose={() => setSelectedSponsorId(null)} />}
    </div>
  );
};
