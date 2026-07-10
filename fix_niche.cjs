const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

// Also need to add import for NicheHub
if (!code.includes("import { NicheHub }")) {
  code = code.replace(
    'import { DynamicPropertyFilter, DynamicFilters } from "../../components/client/DynamicPropertyFilter";',
    'import { DynamicPropertyFilter, DynamicFilters } from "../../components/client/DynamicPropertyFilter";\nimport { NicheHub } from "../../components/client/NicheHub";'
  );
}

const target = `                {/* Main Grid */}
                <div className="">
                  {isLoading ? (`;

const replacement = `                {/* Main Grid or Niche Hub */}
                {selectedNiche === "Zote" && (!committedSearch || committedSearch.trim() === "") && selectedCategory === "Zote" && !selectedFamily && !viewSeller ? (
                  <NicheHub 
                    niches={niches} 
                    products={products} 
                    lang={lang} 
                    onSelectNiche={(n) => {
                      setSelectedNiche(n);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }} 
                  />
                ) : (
                <div className="">
                  {isLoading ? (`;

code = code.replace(target, replacement);

// Oh wait, if it renders NicheHub, we should close the parenthesis `)` right after the Main Grid div.
// Let's find where the `Main Grid` div closes.
// Actually, no, we just replaced the opening of the `<div className="">`.
// Wait, the new wrapper is `{isLobby ? (<NicheHub />) : (<div className="">...)}`.
// I need to close the `)}` at the end of `<div className="">`.
