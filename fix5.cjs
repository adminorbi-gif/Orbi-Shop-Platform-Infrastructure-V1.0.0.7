const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/                      \)\}\n                <\/div>\n              <\/div>\n                    <\/button>/g, '                      )}\n                    </button>');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
