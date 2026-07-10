const fs = require('fs');
let lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');

for(let i=0; i<lines.length; i++) {
  if (lines[i].includes("{showProfile && activeUser ? (")) {
    lines.splice(i, 0, '          </div>', '        </header>');
    break;
  }
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', lines.join('\n'));
