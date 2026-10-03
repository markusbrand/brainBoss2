const fs = require('fs');
let code = fs.readFileSync('src/components/ChildPortal/ChildTestModal.tsx', 'utf8');

code = code.replace(
  "                </div>\n              </div>\n            ) : null}",
  "                </div>\n                )}\n              </div>\n            ) : null}"
);

fs.writeFileSync('src/components/ChildPortal/ChildTestModal.tsx', code);
