const fs = require('fs');
let code = fs.readFileSync('src/components/client/NicheShoppingCenter.tsx', 'utf8');

const themeLogic = `
  const getThemeByNiche = (nicheName: string) => {
    switch (nicheName) {
      case "Electronics & Tech":
        return "bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-blue-400";
      case "Fashion & Apparel":
        return "bg-gradient-to-br from-fuchsia-900 via-pink-900 to-slate-900 text-pink-400";
      case "Home & Furniture":
        return "bg-gradient-to-br from-amber-900 via-orange-900 to-slate-900 text-orange-400";
      case "Health & Beauty":
        return "bg-gradient-to-br from-rose-900 via-pink-900 to-slate-900 text-rose-400";
      case "Auto & Motors":
        return "bg-gradient-to-br from-slate-800 via-gray-900 to-black text-slate-300";
      case "Supermarket & Food":
        return "bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-emerald-400";
      default:
        return "bg-slate-900 text-emerald-400";
    }
  };
  const themeClasses = getThemeByNiche(nicheObj.name);
  const bgColor = themeClasses.split(' ').filter(c => c.startsWith('bg-')).join(' ');
  const textColor = themeClasses.split(' ').filter(c => c.startsWith('text-')).join(' ');

  return (
`;

code = code.replace('  return (\n    <div className="w-full', themeLogic + '    <div className="w-full');

code = code.replace(
  'className="relative overflow-hidden rounded-3xl bg-slate-900 text-white',
  'className={`relative overflow-hidden rounded-3xl text-white ${bgColor}`}'
);

code = code.replace(
  'className="text-3xl sm:text-5xl font-black mb-3 text-emerald-400"',
  'className={`text-3xl sm:text-5xl font-black mb-3 ${textColor}`}'
);

fs.writeFileSync('src/components/client/NicheShoppingCenter.tsx', code);
