const fs = require('fs');
let lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');

if (lines[2829].includes('</>')) {
    lines.splice(2829, 1);
}
if (lines[2830].includes(')}')) {
    lines.splice(2830, 1);
}
if (lines[2831].includes(')}')) {
    lines.splice(2831, 1);
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', lines.join('\n'));
