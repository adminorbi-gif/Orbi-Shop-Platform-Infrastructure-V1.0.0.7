const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

// Fix 1: line 1404
code = code.replace(/                  \)\)\}\n                  <\/div>\n                \)\}\n              <\/div>\n            \)\}\n          <\/div>\n        <\/header>/g, '                  ))}\n                  </div>\n                )}\n              </div>\n            )}');

// Fix 2: missing closing tags at the end of the component
// Since we have an unclosed div, let's just add it before the end of the component fragment.
code = code.replace(/      <\/>\n    \);\n  \}/g, '      </div>\n      </>\n    );\n  }');

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
