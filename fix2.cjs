const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientApp/index.tsx', 'utf8');

code = code.replace(
    '                ) : (\n            {/* Main Store Area */}\n            <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 mt-2 md:mt-3">',
    '                ) : (\n            <>\n            {/* Main Store Area */}\n            <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 mt-2 md:mt-3">'
);

// and then we must find where it closes.
// Wait, when I removed `EndSeq` I replaced it with `              </div>\n            </div>\n              </div>\n            </div>\n            </>\n            )}\n            {/* Contact Form */}`
// But wait! Is there a `</>` to close the `<>`?
