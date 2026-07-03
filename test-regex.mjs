const text = `Hi there,

Some message.

Best regards,
[MyName]
[MyCountry] Chapter Lead
SUNx Climate Friendly Travel
https://www.thesunprogram.com`;

const match = text.match(/\n\n(Best(?: regards)?|Warm regards|Sincerely),[\s\S]*$/i);
if (match) {
  console.log(text.replace(match[0], `\n\n${match[1]},`));
}
