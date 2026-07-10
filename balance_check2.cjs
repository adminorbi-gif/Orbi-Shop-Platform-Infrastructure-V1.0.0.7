const fs = require('fs');
const lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');
let divCount = 0;
let fragCount = 0;
for(let i=0; i<lines.length; i++) {
  const line = lines[i];
  const divsOpen = (line.match(/<div/g) || []).length;
  const divsClose = (line.match(/<\/div>/g) || []).length;
  divCount += divsOpen - divsClose;
  const fragsOpen = (line.match(/<>/g) || []).length;
  const fragsClose = (line.match(/<\/>/g) || []).length;
  fragCount += fragsOpen - fragsClose;
}
console.log(`Final divCount=${divCount} fragCount=${fragCount}`);
