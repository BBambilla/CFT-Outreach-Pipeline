import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { Student, Sponsor, SponsorStatus } from '../types';
import { rawCsv } from './rawCsv';
import { rawCoordinatorCsv } from './coordinatorCsv';

export const loadInitialData = () => {
  const parsed = Papa.parse(rawCsv, { header: true, skipEmptyLines: true });
  const studentsMap = new Map<string, Student>();
  const sponsors: Sponsor[] = [];

  // Add the Admin user
  const adminId = 'student-admin';
  studentsMap.set('Admin', {
    id: adminId,
    name: 'Olly Wheatcroft',
    email: 'olly@thesunprogram.com',
    country: 'Admin',
    continent: 'Global',
  });

  parsed.data.forEach((row: any) => {
    const studentName = row['Student Name']?.trim();
    if (!studentName || studentName.startsWith('Countries') || studentName.startsWith('Students')) return;

    if (!studentsMap.has(studentName)) {
      // Create a deterministic slug for the ID
      const deterministicId = 'student-' + studentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const country = row['Country']?.trim() || '';
      studentsMap.set(studentName, {
        id: deterministicId,
        name: studentName,
        email: `${country.toLowerCase().replace(/\s+/g, '')}@thesunprogram.com`,
        country: country,
        continent: row['Continent / Region']?.trim() || '',
      });
    }

    const student = studentsMap.get(studentName)!;

    const org = row['Possible Sponsor']?.trim();
    if (!org) return;

    const contactName = row['Sponsor Contact Name']?.trim() || '';
    const email = row['Sponsor Email']?.trim() || '';
    const role = row['Sponsor Contact Role']?.trim() || '';
    const phone = row['Sponsor Phone']?.trim() || '';
    const rationale = row['Sponsor Activities / Why Good Fit']?.trim() || '';
    const website = row['Sponsor Website / Portal']?.trim() || '';
    const sourceNotes = row['Notes (based on zoom recordings)']?.trim() || '';
    const onlineNotes = row['Online Research Notes']?.trim() || '';

    const status: SponsorStatus = (contactName && email) ? 'Ready to Contact' : 'To Research';

    const sponsorId = 'sponsor-' + student.id + '-' + org.toLowerCase().replace(/[^a-z0-9]/g, '-');

    sponsors.push({
      id: sponsorId,
      assignedStudentId: student.id,
      organization: org,
      contactName,
      role,
      email,
      phone,
      website,
      rationale,
      sourceNotes,
      researchNotes: onlineNotes,
      status,
      priority: 'Medium',
      createdAt: new Date().toISOString(),
    });
  });

  const parsedAdmin = Papa.parse(rawCoordinatorCsv, { header: true, skipEmptyLines: true });
  
  parsedAdmin.data.forEach((row: any) => {
    const org = row['Organisation']?.trim();
    if (!org) return;

    const contactName = `${row['First Name']?.trim() || ''} ${row['Surname']?.trim() || ''}`.trim();
    const email = row['Email']?.trim() || '';
    const phone = row['Telephone']?.trim() || '';
    const title = row['Title']?.trim() || '';
    const website = row['Website']?.trim() || '';
    const notes = row['Notes']?.trim() || '';
    const linkedIn = row['LinkedIn']?.trim() || '';

    const status: SponsorStatus = (contactName && email) ? 'Ready to Contact' : 'To Research';

    const sponsorId = 'sponsor-admin-' + org.toLowerCase().replace(/[^a-z0-9]/g, '-');

    sponsors.push({
      id: sponsorId,
      assignedStudentId: adminId,
      organization: org,
      contactName,
      role: title,
      email,
      phone,
      website,
      rationale: linkedIn ? `LinkedIn: ${linkedIn}` : '',
      sourceNotes: notes,
      researchNotes: '',
      status,
      priority: 'Medium',
      createdAt: new Date().toISOString(),
    });
  });

  return {
    initialStudents: Array.from(studentsMap.values()),
    initialSponsors: sponsors,
  };
};
