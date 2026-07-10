const fs = require('fs');
let lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');

// verify line 2824 is `              )}`
if (lines[2824].includes(')}')) {
    lines.splice(2824, 1);
} else {
    console.error("line 2824 is " + lines[2824]);
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', lines.join('\n'));
