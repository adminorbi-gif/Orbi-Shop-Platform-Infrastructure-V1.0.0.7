const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

const nicheBlockStart = '                {/* Main Grid or Niche Hub or Niche Shopping Center */}';
const fallbackStart = '                ) : (\n                <div className="">';

const startIndex = code.indexOf(nicheBlockStart);
const fallbackIndex = code.indexOf(fallbackStart);

let nicheLogic = code.substring(startIndex, fallbackIndex + '                ) : (\n'.length);

// Remove the niche logic from the middle of the grid area
code = code.substring(0, startIndex) + code.substring(fallbackIndex + '                ) : (\n'.length);

// Also remove the `              )}\n` that closes the ternary.
// Let's replace the EXACT sequence at the end.
const endSeq = `              </div>\n              )}\n            </div>\n              </div>\n            </div>\n            </>\n            )}\n            {/* Contact Form */}`;
const newEndSeq = `              </div>\n            </div>\n              </div>\n            </div>\n            </>\n            )}\n            {/* Contact Form */}`;

if (code.includes(endSeq)) {
    code = code.replace(endSeq, newEndSeq);
} else {
    // try slightly different whitespace
    const endSeq2 = `              </div>\n              )}\n            </div>`;
    const newEndSeq2 = `              </div>\n            </div>`;
    code = code.replace(endSeq2, newEndSeq2);
}

// Now INSERT the `nicheLogic` at line 1788 (before `            {/* Main Store Area */}`)
const mainStoreArea = '            {/* Main Store Area */}';
const insertIndex = code.indexOf(mainStoreArea);

if (insertIndex !== -1) {
    code = code.substring(0, insertIndex) + nicheLogic + code.substring(insertIndex);
    
    // BUT we need to add `              )}` at the very end to close the ternary!
    // Since we wrapped `Main Store Area`, we need to find where `Main Store Area` ends.
    // It ends right before `{/* Contact Form */}`.
    const contactForm = '            {/* Contact Form */}';
    code = code.replace(contactForm, '              )}\n' + contactForm);
}

// Also wait! The top `<header>` and `Mega Menu` and `Categories`!
// We want to hide `Mega Menu` and `Quick Niche Sub Menu Horizontal Scroll` when `selectedNiche === "Zote"`.
// Wait, the user said "Replace small static menus with large, rich Niche Cards."
// We should REMOVE the `Quick Niche Sub Menu Horizontal Scroll` entirely!
const nicheScrollStart = '          {/* Quick Niche Sub Menu Horizontal Scroll */}';
const megaMenuEnd = '        </header>';
const nicheScrollStartIndex = code.indexOf(nicheScrollStart);
const megaMenuEndIndex = code.indexOf(megaMenuEnd);

if (nicheScrollStartIndex !== -1 && megaMenuEndIndex !== -1) {
    code = code.substring(0, nicheScrollStartIndex) + code.substring(megaMenuEndIndex);
}

fs.writeFileSync('src/pages/ClientApp/index.tsx', code);
console.log("Rewrote code");
