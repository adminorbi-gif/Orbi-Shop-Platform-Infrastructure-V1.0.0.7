const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(
  '<ProductCard\n                          product={p}',
  '<ProductCard\n                          p={p}'
);

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
