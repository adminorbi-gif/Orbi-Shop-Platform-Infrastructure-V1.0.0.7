const fs = require('fs');
let lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');

// remove the ones at 1337 and 1338
if (lines[1336].includes('</>')) {
    lines.splice(1336, 1);
}
if (lines[1336].includes(')}')) {
    lines.splice(1336, 1);
}

// Find the last `</main>`
const lastMainClose = lines.map((l, i) => l.includes('</main>') ? i : -1).filter(i => i !== -1).pop();
if (lastMainClose !== -1) {
    lines.splice(lastMainClose, 0, '          </>', '          )}');
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', lines.join('\n'));
