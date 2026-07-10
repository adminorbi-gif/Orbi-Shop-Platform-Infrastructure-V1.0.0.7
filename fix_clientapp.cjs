const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

// The NicheShoppingCenter tag
code = code.replace(
  '<NicheShoppingCenter \n                    nicheObj={',
  '<NicheShoppingCenter \n                    activeDynamicFilters={activeDynamicFilters}\n                    setActiveDynamicFilters={setActiveDynamicFilters}\n                    nicheObj={'
);

// We should also remove it from the old top-level Family View if it exists there, since it's going to be in NicheShoppingCenter. Wait, if the user navigates directly to a family (which doesn't involve niche), maybe we want to keep it there too?
// Wait, NicheShoppingCenter won't be rendered if selectedNiche === "Zote". But family navigation might set selectedNiche?
// Let's leave it in both places for now. It won't hurt.

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
