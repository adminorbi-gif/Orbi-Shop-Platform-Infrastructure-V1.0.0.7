# ARCHITECTURE TODO IMPROVEMENTS FOR Orbishop V1.0.1.0

## 1. Executive Vision
Transform Orbi Marketplace from a generalized, mixed-product feed into a highly specialized, multi-vertical "Shopping Mall" experience. The goal is to eliminate cognitive overload (e.g., mixing Cars with Blenders) by introducing isolated, dedicated shopping environments for each of the 10+ Niches, while supporting deep, dynamic filtering for 50+ categories and 150+ families.

## 2. Core Architectural Shifts & UI Design Plan

### A. The "Mall Lobby" (Home Page Hub)
**Current State:** A unified product feed with static niche/category pills.
**New Architecture:**
*   **Default View:** When the app opens, it defaults to the "Niche Exploration Hub".
*   **Header:** "What would you like to Explore?"
*   **Niche Cards:** Replace small static menus with large, rich Niche Cards. 
    *   *Logic:* Each card dynamically aggregates 3-4 top/sample products from that specific niche to show a visual preview.
    *   *Interaction:* Clicking a Niche Card acts as a portal, navigating the user to a dedicated "Niche Page" (Specialized Shopping Center).

### B. The "Specialized Shopping Center" (Dedicated Niche Page)
**Current State:** Filtering just shrinks the master list.
**New Architecture:** 
*   **Isolated Context:** A completely dedicated view for the selected Niche.
*   **Category Navigation:** Categories for this niche are moved to a sticky top navigation bar (just below the main app bar), allowing horizontal scrolling.
*   **Family Navigation:** Selecting a Category reveals a secondary row of Family pills specific to that category.

### C. Dynamic Property Extraction & Filtering Engine
**Current State:** Filters are limited to price, niche, and category.
**New Architecture:**
*   **Property Extractor Utility:** Build a pure function that analyzes the `description` object/table of all loaded products within a selected Family.
*   **Dynamic UI Construction:** If the user is in the "Phones" family, the engine automatically detects keys like `RAM`, `Storage`, `Color`, and `Display` across those products.
*   **Filter Sidebar/Drawer:** The UI dynamically renders checkboxes or chips for these extracted properties (e.g., `[ ] 8GB RAM`, `[ ] 16GB RAM`), allowing high-end, Amazon-style granular filtering without hardcoding schema changes.

## 3. Execution Roadmap (TODOs)

### Phase 1: Data Aggregation & The Mall Lobby
- [ ] **Create `NicheHub` Component:** Design the grid layout for the new Niche Cards.
- [ ] **Dynamic Previews:** Write logic to extract top products per niche to display inside the Niche Cards.
- [ ] **State/Routing Update:** Modify `ClientApp` root state to show `NicheHub` when `selectedNiche` is null or "All".

### Phase 2: Specialized Niche View
- [ ] **Create `NicheShoppingCenter` Component:** A dedicated layout that receives the active Niche.
- [ ] **Top-Level Category Bar:** Refactor category filters into a horizontally scrollable sticky header.
- [ ] **Family Sub-Navigation:** Render family chips dynamically based on the selected category.

### Phase 3: Dynamic Description Filtering
- [ ] **Build `extractFamilyProperties(products, family)` Utility:** 
      - Parse product descriptions.
      - Aggregate unique keys (e.g., "Storage").
      - Map unique available values for those keys.
- [ ] **Build `DynamicPropertyFilter` Component:**
      - Render UI inputs based on the extracted map.
      - Implement multi-select filter logic against the active product feed.
- [ ] **Integrate Filter Drawer:** Add a "Filter" button that opens a side drawer or modal containing these dynamic options on mobile, or a left-sidebar on desktop.

## 4. Safety & Backward Compatibility Rules
1. **Zero Schema Changes Required:** The dynamic filter engine MUST run client-side (or via existing DB JSON queries) analyzing existing `description` objects. Do not break the current `Product` type.
2. **Preserve Cart & State:** Ensure transitioning between the Hub and Niche Pages does not reset the user's shopping cart or session data.
3. **Strict CSS Adherence:** Continue using the established Tailwind Grid architecture (`.orbi-product-list-grid`). Never fallback to generic flex-wrap for the main product streams.
