const fs = require('fs');
let lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');

// Find Contact Form
const contactIndex = lines.findIndex(line => line.includes('{/* Contact Form */}'));
if (contactIndex !== -1) {
    // Wait, the `<>` from 1605 is inside the `selectedFamily` ternary's else branch!
    // The `selectedFamily` ternary's else branch contains `<>` at 1605.
    // So the `</>` needs to be right before the `)}` that closes `selectedFamily` ternary!
    // Or we can just put `</>` before ` {/* Contact Form */} ` if it is inside the fragment?
    // Let's just put `</>` before ` {/* Contact Form */} `.
    // But wait, what if `Contact Form` is inside the fragment?
    lines.splice(contactIndex, 0, '            </>');
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', lines.join('\n'));
