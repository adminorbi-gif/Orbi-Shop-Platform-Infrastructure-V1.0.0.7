const fs = require('fs');
const lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');
let divCount = 0;
let mainCount = 0;
let headerCount = 0;
let footerCount = 0;

for(let i=0; i<lines.length; i++) {
  const line = lines[i];
  if(line.includes("return () =>")) continue; // ignore useEffect return
  if(i > 4010) break; // End of component
  
  const divsOpen = (line.match(/<div/g) || []).length;
  const divsClose = (line.match(/<\/div>/g) || []).length;
  divCount += divsOpen - divsClose;

  const mainOpen = (line.match(/<main/g) || []).length;
  const mainClose = (line.match(/<\/main>/g) || []).length;
  mainCount += mainOpen - mainClose;

  const headerOpen = (line.match(/<header/g) || []).length;
  const headerClose = (line.match(/<\/header>/g) || []).length;
  headerCount += headerOpen - headerClose;
  
  const footerOpen = (line.match(/<footer/g) || []).length;
  const footerClose = (line.match(/<\/footer>/g) || []).length;
  footerCount += footerOpen - footerClose;

  if (i % 100 === 0) {
    console.log(`Line ${i}: div=${divCount} main=${mainCount} header=${headerCount} footer=${footerCount}`);
  }
}
console.log(`Final: div=${divCount} main=${mainCount} header=${headerCount} footer=${footerCount}`);
