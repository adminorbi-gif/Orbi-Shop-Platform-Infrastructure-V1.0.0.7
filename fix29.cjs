const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/                  <\/button>\n                <\/div>\n              <\/div>\n            \) : \(/g, '                  </button>\n                </div>\n              </div>\n              </div>\n              </div>\n            ) : (');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
