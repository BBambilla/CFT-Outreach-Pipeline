import sys
content = open("src/data/initialData.ts").read()
content = content.replace("studentName === 'Junelle Lovelace' ? 'junelle.lovelace@thesunprogram.com' : `${country.toLowerCase().replace(/\s+/g, '')}@thesunprogram.com`,", "`${country.toLowerCase().replace(/\s+/g, '')}@thesunprogram.com`,")
open("src/data/initialData.ts", "w").write(content)
