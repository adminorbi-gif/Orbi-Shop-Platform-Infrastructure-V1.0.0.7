const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(/              <\/div>\n            \)\}\n        \{showProfile && activeUser \? \(/g, '              </div>\n          </div>\n        </header>\n        {showProfile && activeUser ? (');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
