const fs = require('fs');
let lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('</>') && lines[i+2] && lines[i+2].includes('</main>')) {
        if (i < 1500) {
            lines.splice(i, 1);
            break;
        }
    }
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', lines.join('\n'));
