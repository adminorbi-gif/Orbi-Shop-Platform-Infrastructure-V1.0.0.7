const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

const nicheBlockStart = '                {/* Main Grid or Niche Hub or Niche Shopping Center */}';
const fallbackStart = '                ) : (\n                <div className="">';

const startIndex = code.indexOf(nicheBlockStart);
const fallbackIndex = code.indexOf(fallbackStart);

if (startIndex === -1 || fallbackIndex === -1) {
    console.error("Could not find Niche block");
    process.exit(1);
}

// 1. Extract the Niche logic
let nicheLogic = code.substring(startIndex, fallbackIndex + '                ) : (\n'.length);

// 2. Remove the Niche logic from its current place
code = code.substring(0, startIndex) + code.substring(fallbackIndex + '                ) : (\n'.length);

// Also remove the closing `)}` that was added for the Niche logic.
// It is at line 2939 approximately. Let's find it.
// The code had:
//                      )}
//                    </div>
//                  )}
//              </div>
//              )}
//            </div>

const closingSearchStr = `                    </div>\n                  )}\n              </div>\n              )}\n            </div>`;
// Wait, the grid ended with:
//                  ) : (
//                    <div className="space-y-8">
//                      {similarSuggestions.length > 0 ? (
//                        ...
//                      ) : (
//                        ...
//                      )}
//                    </div>
//                  )}
