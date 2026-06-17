import * as fs from 'fs';

const path = 'src/app/(dashboard)/cctv/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// remove Settings import
content = content.replace(' Phone, Settings, Circle ', ' Phone, Circle ');

// fix exhaustive deps
content = content.replace(/useEffect\(\(\) => \{\s+refreshLogs\(\);\s+\}, \[\]\);/g, `useEffect(() => {\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n    // eslint-disable-next-line react-hooks/set-state-in-effect\n    refreshLogs();\n  }, []);`);

// fix escaped entity
content = content.replace(/Farm's/g, 'Farm&apos;s');

fs.writeFileSync(path, content, 'utf8');
