const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/                  <\/span>\n            <\/div>\n          <\/div>\n        \)\}/g, '                  </span>\n                </div>\n              </div>\n            </div>\n          </div>\n        )}');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
