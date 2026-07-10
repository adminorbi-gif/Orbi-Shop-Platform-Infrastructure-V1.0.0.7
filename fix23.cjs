const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/            <\/>\n            \)\}\n            \{\/\* Contact Form \*\/\}/g, '            {/* Contact Form */}');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
