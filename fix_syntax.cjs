const fs = require('fs');
let code = fs.readFileSync('src/components/client/NicheShoppingCenter.tsx', 'utf8');

code = code.replace(
  'className={`relative overflow-hidden rounded-3xl text-white ${bgColor}`} p-8 sm:p-12 shadow-sm flex flex-col sm:flex-row items-center sm:justify-between gap-6">',
  'className={`relative overflow-hidden rounded-3xl text-white ${bgColor} p-8 sm:p-12 shadow-sm flex flex-col sm:flex-row items-center sm:justify-between gap-6`}>'
);

fs.writeFileSync('src/components/client/NicheShoppingCenter.tsx', code);
