const fs = require('fs');
let lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');

// verify line 2831 is `              )}`
if (lines[2831].includes(')}')) {
    lines.splice(2831, 1);
} else {
    console.error("line 2831 is " + lines[2831]);
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', lines.join('\n'));
