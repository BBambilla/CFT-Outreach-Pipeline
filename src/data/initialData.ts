import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { Student, Sponsor, SponsorStatus } from '../types';
import { rawCsv } from './rawCsv';

export const loadInitialData = () => {
  const parsed = Papa.parse(rawCsv, { header: true, skipEmptyLines: true });
  const studentsMap = new Map<string, Student>();
  const sponsors: Sponsor[] = [];

  parsed.data.forEach((row: any) => {
    const studentName = row['Student Name']?.trim();
    if (!studentName || studentName.startsWith('Countries') || studentName.startsWith('Students')) return;

    if (!studentsMap.has(studentName)) {
      studentsMap.set(studentName, {
        id: uuidv4(),
        name: studentName,
        email: `${studentName.split(' ')[0].toLowerCase()}@example.com`,
        country: row['Country']?.trim() || '',
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

    sponsors.push({
      id: uuidv4(),
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

  return {
    initialStudents: Array.from(studentsMap.values()),
    initialSponsors: sponsors,
  };
};
