const fs = require('fs');
let lines = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8').split('\n');

const contactIndex = lines.findIndex(line => line.includes('id="support-contact"'));
if (contactIndex !== -1) {
    // lines[contactIndex - 1] is `            <div`
    // lines[contactIndex - 2] is `            {/* Contact Form */}`
    lines.splice(contactIndex - 2, 0, '            </>', '            )}');
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', lines.join('\n'));
