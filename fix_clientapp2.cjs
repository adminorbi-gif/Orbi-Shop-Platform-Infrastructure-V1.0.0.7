const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(
  '<NicheShoppingCenter\n                    nicheObj={',
  '<NicheShoppingCenter\n                    activeDynamicFilters={activeDynamicFilters}\n                    setActiveDynamicFilters={setActiveDynamicFilters}\n                    nicheObj={'
);

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
