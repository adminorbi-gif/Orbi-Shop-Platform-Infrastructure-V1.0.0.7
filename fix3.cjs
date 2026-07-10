const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/                  \)\n                <\/div>\n              <\/div>/g, '                  )}');

// And remove the manual fix I did for line 493 which was:
// `                  )}\n                </div>\n                {value === opt.id && (`
code = code.replace(/                  \)\}\n                <\/div>\n                \{value === opt\.id && \(/g, '                  )}\n                {value === opt.id && (');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
