const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

// The Niche block to extract:
const nicheBlockStart = '                {/* Main Grid or Niche Hub or Niche Shopping Center */}';
const fallbackStart = '                ) : (\n                <div className="">';

const nicheBlockIndex = code.indexOf(nicheBlockStart);
const fallbackIndex = code.indexOf(fallbackStart);

if (nicheBlockIndex === -1 || fallbackIndex === -1) {
    console.error("Could not find Niche block");
    process.exit(1);
}

const nicheLogic = code.substring(nicheBlockIndex, fallbackIndex + '                ) : (\n'.length);
// Also I need to remove the closing `)}` at the end of the grid, or just move the NicheLogic to line 1788 and wrap the rest.

// The rest of the grid goes down to:
const endGrid = '                    </div>\n                  )}\n              </div>\n              )}\n            </div>\n              </div>\n            </div>\n            </>\n            )}';

