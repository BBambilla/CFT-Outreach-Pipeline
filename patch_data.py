import sys
content = open("src/data/initialData.ts").read()
old_line = "email: `${country.toLowerCase().replace(/\s+/g, '')}@thesunprogram.com`,"
new_line = "email: country === 'Trinidad and Tobago' ? 'trinidad-tobago@thesunprogram.com' : `${country.toLowerCase().replace(/\\s+/g, '')}@thesunprogram.com`,"
if old_line in content:
    content = content.replace(old_line, new_line)
    open("src/data/initialData.ts", "w").write(content)
    print("Patched initialData.ts")
else:
    print("Could not find line to patch in initialData.ts")
