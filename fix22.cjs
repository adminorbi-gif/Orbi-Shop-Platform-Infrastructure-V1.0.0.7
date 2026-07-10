const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/              <\/div>\n            <\/div>\n            <\/>\n            \)\}\n            \{\/\* Contact Form \*\/\}/g, '              </div>\n            </div>\n            {/* Contact Form */}');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
