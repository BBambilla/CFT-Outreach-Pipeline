const draftEmail = `Dear John,

I would like to discuss...

We are looking for local sponsors to:

- Support our kids' education programme.
- Build Climate Friendly Travel Chapters.
- Create CFT Action Plans.

If this is of interest... https://calendly.com/olly/30min

Best wishes,`;

let htmlContent = draftEmail
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#1155cc;">$1</a>')
  .replace(/\n/g, '<br>');

htmlContent = htmlContent.replace(/(?:<br>- (.*?))+(?=<br>|$)/g, (match) => {
  const items = match.split('<br>- ').filter(Boolean).map(item => `<li>${item}</li>`).join('');
  return `<br><ul style="margin-top:8px;margin-bottom:8px;padding-left:24px;list-style-type:disc;">${items}</ul>`;
});

console.log(htmlContent);

