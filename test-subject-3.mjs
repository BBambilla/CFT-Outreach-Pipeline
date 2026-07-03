function getNewSubject(country) {
  return `Supporting National Tourism Climate Resilience in ${country ? country : 'your country'}`;
}

console.log(getNewSubject('Kenya'));
console.log(getNewSubject(''));
console.log(getNewSubject(null));
console.log(getNewSubject(undefined));
