const fs = require('fs');
let lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');

const idx = lines.findIndex(line => line.trim() === '</>' && lines[Math.min(line.length-1, lines.indexOf(line)+1)].includes('</main>'));

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('</>') && lines[i+1] && lines[i+1].includes('</main>')) {
        console.log("Found at", i);
        // wait, we just added `</>` before `</main>` at the VERY END!
        // The one at 1337 is `</>` before `</main>`!
        // We only want to remove the one inside CustomerProfile branch.
        if (i < 1500) {
            lines.splice(i, 1);
            break;
        }
    }
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', lines.join('\n'));
