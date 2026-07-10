const fs = require('fs');
let lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');

const mainClose = lines.findIndex(line => line.includes('</main>'));
if (mainClose !== -1) {
    lines.splice(mainClose, 0, '            </>', '            )}');
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', lines.join('\n'));
