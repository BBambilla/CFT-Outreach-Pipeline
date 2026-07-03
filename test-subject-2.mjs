function personalizeSubject(subject, company) {
  if (!company) return subject;
  
  let result = subject.trim();
  
  if (result.toLowerCase() === 'an invitation to join the climate friendly travel registry') {
    return `An invitation for ${company} to join the Climate Friendly Travel Registry`;
  }
  
  const followUpRegex = /^following up/i;
  if (followUpRegex.test(result)) {
    return result.replace(/^following up( on| regarding)?/i, (match, p1) => {
      return `Following up with ${company}${p1 || ''}`;
    });
  }
  
  return `${company} — ${result}`;
}

console.log(personalizeSubject('Following up on the Climate Friendly Travel Registry', 'Arden University'));
console.log(personalizeSubject('Following up', 'Arden University'));
console.log(personalizeSubject('Following up regarding the registry', 'Arden University'));

