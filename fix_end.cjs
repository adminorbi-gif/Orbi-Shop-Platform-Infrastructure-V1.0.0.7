const fs = require('fs');
let lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');

// remove `</>` at 2832
if (lines[2831].includes('</>')) {
    lines.splice(2831, 1);
}

// insert `</>` before `</main>` at 2839 (now 2838 because of splice)
const mainClose = lines.findIndex(line => line.includes('</main>'));
if (mainClose !== -1) {
    lines.splice(mainClose, 0, '            </>');
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', lines.join('\n'));
