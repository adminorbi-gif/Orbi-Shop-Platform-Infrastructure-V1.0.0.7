const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/              \{\/\* Chat messages \*\/\}/g, '                </div>\n              </div>\n              {/* Chat messages */}');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
