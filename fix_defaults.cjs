const fs = require('fs');

let dynPropCode = fs.readFileSync('src/components/client/DynamicPropertyFilter.tsx', 'utf8');
dynPropCode = dynPropCode.replace('activeFilters,', 'activeFilters = {},');
fs.writeFileSync('src/components/client/DynamicPropertyFilter.tsx', dynPropCode);

let nicheCode = fs.readFileSync('src/components/client/NicheShoppingCenter.tsx', 'utf8');
nicheCode = nicheCode.replace('activeDynamicFilters,', 'activeDynamicFilters = {},');
fs.writeFileSync('src/components/client/NicheShoppingCenter.tsx', nicheCode);

