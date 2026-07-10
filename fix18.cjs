const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/                  \}\)\}\n                  <\/div>\n                \)\}\n              <\/div>/g, '                  ))}\n                </div>\n              </div>');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
