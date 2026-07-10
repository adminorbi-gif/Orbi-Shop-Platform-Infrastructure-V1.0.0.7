const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

if (!code.includes("import { NicheShoppingCenter }")) {
  code = code.replace(
    'import { NicheHub } from "../../components/client/NicheHub";',
    'import { NicheHub } from "../../components/client/NicheHub";\nimport { NicheShoppingCenter } from "../../components/client/NicheShoppingCenter";'
  );
}

const targetOpen = `                {/* Main Grid or Niche Hub */}
                {selectedNiche === "Zote" && (!committedSearch || committedSearch.trim() === "") && selectedCategory === "Zote" && !selectedFamily && !viewSeller ? (`;

const replacementOpen = `                {/* Main Grid or Niche Hub or Niche Shopping Center */}
                {selectedNiche === "Zote" && (!committedSearch || committedSearch.trim() === "") && selectedCategory === "Zote" && !selectedFamily && !viewSeller ? (`;

code = code.replace(targetOpen, replacementOpen);

const targetMiddle = `                  />
                ) : (
                <div className="">`;

const replacementMiddle = `                  />
                ) : selectedNiche !== "Zote" && (!committedSearch || committedSearch.trim() === "") && !viewSeller ? (
                  <NicheShoppingCenter
                    nicheObj={niches.find((n) => n.name === selectedNiche) || niches[0]}
                    allCategories={categories}
                    products={products}
                    lang={lang}
                    onBack={() => {
                      setSelectedNiche("Zote");
                      setSelectedCategory("Zote");
                      setSelectedFamily(null);
                    }}
                    onSelectCategory={setSelectedCategory}
                    onSelectFamily={setSelectedFamily}
                    selectedCategory={selectedCategory}
                    selectedFamily={selectedFamily}
                    renderProductCard={(p) => {
                      const pSeller = sellers.find((s) => s.id === p.sellerId);
                      return (
                        <ProductCard
                          product={p}
                          seller={pSeller}
                          onAdd={(openCart) => addToCart(p, openCart)}
                          onSelect={() => handleProductSelect(p)}
                          onInteract={() => trackProductInteraction(p)}
                          onViewSeller={(s) => {
                            setViewSeller(s);
                            setSelectedNiche("Zote");
                            setSelectedCategory("Zote");
                            setSearch("");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          lang={lang}
                          reviews={allReviews[p.id] || []}
                          isLiked={likedProductIds.includes(p.id)}
                          onLikeToggle={toggleLikeProduct}
                        />
                      );
                    }}
                  />
                ) : (
                <div className="">`;

code = code.replace(targetMiddle, replacementMiddle);

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
