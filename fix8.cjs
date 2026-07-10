const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/                  \)\}\n                \{\/\* What are you looking for automated recommendation bar \*\/\}/g, '                  )}\n                </div>\n              </div>\n                {/* What are you looking for automated recommendation bar */}');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
