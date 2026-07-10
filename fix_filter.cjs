const fs = require('fs');
let code = fs.readFileSync('src/components/client/NicheShoppingCenter.tsx', 'utf8');

code = code.replace(
  'return activeValues.some(val => descLower.includes(val.toLowerCase()));',
  'return activeValues.some(val => val && descLower.includes(val.toLowerCase()));'
);

fs.writeFileSync('src/components/client/NicheShoppingCenter.tsx', code);
