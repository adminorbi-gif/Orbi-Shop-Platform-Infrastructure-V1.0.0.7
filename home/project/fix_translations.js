const fs = require('fs');

const files = ['src/pages/AdminApp.tsx', 'src/pages/ClientApp.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // We are going to find common dual language strings and replace them with lang === "sw" ? ... : ...
  // Be careful not to replace text inside quotes directly if they are strings, but most are in JSX Text or already in quotes within JSX.
  
  const replacements = {
    'Tengeneza Otomatiki / Auto Generate': '{lang === "sw" ? "Tengeneza Otomatiki" : "Auto Generate"}',
    'Msimbo / Code': '{lang === "sw" ? "Msimbo" : "Code"}',
    'Punguzo / Discount (%)': '{lang === "sw" ? "Punguzo (%)" : "Discount (%)"}',
    'Mapendekezo ya Wateja / Suggested Customers': '{lang === "sw" ? "Mapendekezo ya Wateja" : "Suggested Customers"}',
    '-- Yeyote / Anyone --': '{lang === "sw" ? "-- Yeyote --" : "-- Anyone --"}',
    'Wateja Watiifu / Loyal Customers': 'Wateja Watiifu', // within optgroup label
    'Wateja Wote / All Customers': 'Wateja Wote',
    'Zote / All': '{lang === "sw" ? "Zote" : "All"}',
    'Tarehe ya Kuisha / Expiry Date': '{lang === "sw" ? "Tarehe ya Kuisha" : "Expiry Date"}',
    'Iwe Wazi Pamoja / Active Immediately': '{lang === "sw" ? "Iwe Wazi Pamoja" : "Active Immediately"}',
    'Ghairi / Cancel': '{lang === "sw" ? "Ghairi" : "Cancel"}',
    'Hifadhi / Save': '{lang === "sw" ? "Hifadhi" : "Save"}',
    'Hifadhi / Reset': '{lang === "sw" ? "Hifadhi" : "Reset"}',
    'Tuma / Send': '{lang === "sw" ? "Tuma" : "Send"}',
    'Print / Save PDF': '{lang === "sw" ? "Pakua PDF" : "Print / Save PDF"}',
    'Nenosiri / PIN ya Kufuta Oda': '{lang === "sw" ? "Nenosiri / PIN ya Kufuta Oda" : "Delete Order PIN"}',
    'Anuani / Mahali': '{lang === "sw" ? "Anuani" : "Address"}',
    'Barua Pepe / Email': '{lang === "sw" ? "Barua Pepe" : "Email"}',
    '"Tafadhali jaza taarifa zote / Please fill all fields"': 'lang === "sw" ? "Tafadhali jaza taarifa zote" : "Please fill all fields"',
    '"Kuponi imeongezwa kikamilifu / Coupon added successfully"': 'lang === "sw" ? "Kuponi imeongezwa kikamilifu" : "Coupon added successfully"',
    '"Kuponi imefutwa / Coupon deleted"': 'lang === "sw" ? "Kuponi imefutwa" : "Coupon deleted"',
    // The trick is some are text children and some are string props. Let's do simple text replace for JSX text nodes:
    '>Msimbo / Code<': '>{lang === "sw" ? "Msimbo" : "Code"}<',
    // We already handled them carefully above manually where possible. 
  };

  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }

  // Specifically fix some label="Wateja..." strings
  content = content.replace(/label="Wateja Watiifu \/ Loyal Customers"/g, 'label={lang === "sw" ? "Wateja Watiifu" : "Loyal Customers"}');
  content = content.replace(/label="Wateja Wote \/ All Customers"/g, 'label={lang === "sw" ? "Wateja Wote" : "All Customers"}');

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Replacements completed.');
