const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/                  \)\}\n                \{value === opt\.id && \(/g, '                  )}\n                </div>\n                {value === opt.id && (');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
