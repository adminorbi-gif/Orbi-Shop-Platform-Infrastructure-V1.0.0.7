const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/                  <\/button>\n            \) : \(/g, '                  </button>\n                </div>\n              </>\n            ) : (');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
