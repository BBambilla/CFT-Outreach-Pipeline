function personalizeSubject(subject, company) {
  if (!company) return subject;
  
  let result = subject.trim();
  
  if (result.toLowerCase() === 'an invitation to join the climate friendly travel registry') {
    return `An invitation for ${company} to join the Climate Friendly Travel Registry`;
  }
  
  const followUpRegex = /^following up( on)?( the)? climate friendly travel registry/i;
  if (followUpRegex.test(result)) {
    return result.replace(/^following up( on)?/i, `Following up with ${company} on`);
  }
  
  return `${company} — ${result}`;
}

console.log(personalizeSubject('An invitation to join the Climate Friendly Travel Registry', 'Arden University'));
console.log(personalizeSubject('Following up on the Climate Friendly Travel Registry', 'Arden University'));
console.log(personalizeSubject('Some other subject here', 'Arden University'));

