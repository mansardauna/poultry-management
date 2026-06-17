import * as fs from 'fs';

const path = 'src/app/api/settings/route.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("'use strict';")) {
  content = "'use strict';\n" + content;
}

content = content.replace("import { and, eq } from 'drizzle-orm';", "import { eq } from 'drizzle-orm';");

content = content.replace('export async function GET()', '/** Exported function GET */\nexport async function GET()');
content = content.replace('export async function POST(req: Request)', '/** Exported function POST */\nexport async function POST(req: Request)');
content = content.replace(/catch \(_error\)/g, 'catch');
content = content.replace(/catch \(error\)/g, 'catch');

fs.writeFileSync(path, content, 'utf8');
