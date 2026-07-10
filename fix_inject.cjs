const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

// Also need to add import for NicheHub
if (!code.includes("import { NicheHub }")) {
  code = code.replace(
    'import { DynamicPropertyFilter, DynamicFilters } from "../../components/client/DynamicPropertyFilter";',
    'import { DynamicPropertyFilter, DynamicFilters } from "../../components/client/DynamicPropertyFilter";\nimport { NicheHub } from "../../components/client/NicheHub";'
  );
}

const targetOpen = `                {/* Main Grid */}
                <div className="">`;

const replacementOpen = `                {/* Main Grid or Niche Hub */}
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
                <div className="">`;

code = code.replace(targetOpen, replacementOpen);

const targetClose = `                        </div>
                      )}
                    </div>`;

// Be careful to only replace the first occurrence after targetOpen
const splitAt = code.indexOf(replacementOpen) + replacementOpen.length;
const firstHalf = code.substring(0, splitAt);
const secondHalf = code.substring(splitAt);

const replacedSecondHalf = secondHalf.replace(targetClose, `                        </div>
                      )}
                    </div>
                )}`);

code = firstHalf + replacedSecondHalf;

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
