const fs = require('fs');
let code = fs.readFileSync('src/components/client/NicheShoppingCenter.tsx', 'utf8');

const newCatLogic = `
  const nicheCategories = React.useMemo(() => {
    if (nicheObj?.categories && nicheObj.categories.length > 0) {
      return nicheObj.categories;
    }
    const catNames = Array.from(new Set(
      products
        .filter(p => p.niche === nicheObj.name || (!p.niche && nicheObj.name === "Mengineyo"))
        .map(p => p.category)
        .filter(Boolean)
    ));
    return catNames.map(name => ({ name, families: [] }));
  }, [nicheObj, products]);
`;

code = code.replace(
  '  const nicheCategories = allCategories.filter((c) => nicheObj.categories.includes(c.name));',
  newCatLogic
);

code = code.replace(
  '              key={cat.id}',
  '              key={cat.name}'
);

fs.writeFileSync('src/components/client/NicheShoppingCenter.tsx', code);
