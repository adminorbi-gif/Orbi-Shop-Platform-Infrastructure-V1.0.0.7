const fs = require('fs');
let code = fs.readFileSync('src/components/client/NicheShoppingCenter.tsx', 'utf8');

if (!code.includes("import { DynamicPropertyFilter")) {
  code = code.replace(
    'import { motion, AnimatePresence } from "motion/react";',
    'import { motion, AnimatePresence } from "motion/react";\nimport { DynamicPropertyFilter, DynamicFilters } from "./DynamicPropertyFilter";'
  );
}

// Add props to interface
if (!code.includes("activeDynamicFilters: DynamicFilters;")) {
  code = code.replace(
    '  renderProductCard: (p: Product) => React.ReactNode;\n}',
    '  renderProductCard: (p: Product) => React.ReactNode;\n  activeDynamicFilters: DynamicFilters;\n  setActiveDynamicFilters: (filters: DynamicFilters) => void;\n}'
  );
}

// Add to destructuring
code = code.replace(
    '  renderProductCard,\n}) => {',
    '  renderProductCard,\n  activeDynamicFilters,\n  setActiveDynamicFilters,\n}) => {'
  );

// Insert sidebar layout around the Products Grid
const targetGrid = `      <div className="w-full mt-4">
        {displayProducts.length > 0 ? (`;

const replaceGrid = `      {/* Product Listing Area Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
        {/* Filter Sidebar (Only visible when a specific category is selected) */}
        {selectedCategory !== "Zote" && (
          <div className="w-full md:w-64 shrink-0 hidden md:block">
            <DynamicPropertyFilter 
              products={products.filter(p => p.category === selectedCategory && (p.niche === nicheObj.name || (!p.niche && nicheObj.name === "Mengineyo")))}
              activeFilters={activeDynamicFilters}
              onFilterChange={setActiveDynamicFilters}
              lang={lang}
            />
          </div>
        )}

        {/* Main Grid */}
        <div className="flex-1 w-full min-w-0">
          {selectedCategory !== "Zote" && (
            <div className="md:hidden mb-4">
               <DynamicPropertyFilter 
                products={products.filter(p => p.category === selectedCategory && (p.niche === nicheObj.name || (!p.niche && nicheObj.name === "Mengineyo")))}
                activeFilters={activeDynamicFilters}
                onFilterChange={setActiveDynamicFilters}
                lang={lang}
              />
            </div>
          )}

          {displayProducts.length > 0 ? (`;

code = code.replace(targetGrid, replaceGrid);

// Close the flex container
const targetClose = `          </div>
        )}
      </div>
    </div>`;

const replaceClose = `          </div>
        )}
        </div>
      </div>
    </div>`;

code = code.replace(targetClose, replaceClose);

// Filter displayProducts by activeDynamicFilters!
const filterLogic = `
  if (selectedFamily) {
    displayProducts = displayProducts.filter((p) => p.family === selectedFamily);
  }

  // Apply Dynamic Filters
  if (Object.keys(activeDynamicFilters).length > 0) {
    displayProducts = displayProducts.filter((p) => {
      if (!p.description) return true;
      const descLower = p.description.toLowerCase();
      
      return Object.entries(activeDynamicFilters).every(([propKey, activeValues]) => {
        if (!activeValues || activeValues.length === 0) return true;
        
        // This is a simple substring match for the exact property text based on propertyExtractor output
        // In a real scenario, this would be more robust.
        return activeValues.some(val => descLower.includes(val.toLowerCase()));
      });
    });
  }
`;

code = code.replace(
  `  if (selectedFamily) {
    displayProducts = displayProducts.filter((p) => p.family === selectedFamily);
  }`, filterLogic);

fs.writeFileSync('src/components/client/NicheShoppingCenter.tsx', code);
