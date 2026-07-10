const fs = require('fs');
let lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');

// remove the `</>` we just added at 2832
lines.splice(2832, 1);

// find the `)}` at the end of the main tag (around 2839)
const mainCloseIndex = lines.findIndex(line => line.includes('</main>'));
if (mainCloseIndex !== -1) {
    // We want to insert `</>` right before `</main>` ?? No, wait.
    // Let's trace where the `selectedFamily` ternary closes.
    // It is `)}` right AFTER `</main>`? No, `</main>` is inside the ternary!
    // wait!
    lines.splice(mainCloseIndex, 0, '            </>');
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', lines.join('\n'));
