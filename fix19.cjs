const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/            \{\/\* Contact Form \*\/\}/g, '            </>\n            )}\n            {/* Contact Form */}');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
