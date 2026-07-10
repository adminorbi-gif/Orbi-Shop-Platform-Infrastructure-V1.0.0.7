const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/            \)\}\n        \{showProfile/g, '            )}\n          </div>\n        </header>\n        {showProfile');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
