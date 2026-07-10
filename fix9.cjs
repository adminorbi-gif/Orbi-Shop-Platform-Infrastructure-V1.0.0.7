const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/                  \)\)\}\n            \)\}\n          <\/div>\n        <\/header>/g, '                  ))}\n                  </div>\n                )}\n              </div>\n            )}\n          </div>\n        </header>');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
