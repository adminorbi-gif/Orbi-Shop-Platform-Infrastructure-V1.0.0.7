const fs = require('fs');
const lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');

// Find line 1664
if (lines[1663].includes('                </div>')) {
    lines.splice(1664, 0, '              )}');
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', lines.join('\n'));
