import * as fs from 'fs';
import * as path from 'path';

const filesWithErrors = [
  'src/app/api/ai-parse/route.ts',
  'src/app/api/batches/route.ts',
  'src/app/api/cctv/route.ts',
  'src/app/api/contacts/route.ts',
  'src/app/api/eggs/route.ts',
  'src/app/api/feeds/route.ts',
  'src/app/api/finance/route.ts',
  'src/app/api/health/route.ts',
  'src/app/api/housing/route.ts',
  'src/app/api/inventory/route.ts',
  'src/app/api/sales/route.ts',
  'src/app/api/settings/route.ts',
  'src/app/api/staff/route.ts'
];

for (const f of filesWithErrors) {
  const p = path.join(process.cwd(), f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/catch \(_error\)/g, 'catch');
    content = content.replace(/catch \(error\)/g, 'catch');
    
    // fix any types
    content = content.replace(/any/g, 'unknown');

    fs.writeFileSync(p, content, 'utf8');
  }
}

const aiLogModalPath = 'src/components/ui/AiLogModal.tsx';
if (fs.existsSync(aiLogModalPath)) {
  let content = fs.readFileSync(aiLogModalPath, 'utf8');
  content = content.replace(/any/g, 'unknown');
  fs.writeFileSync(aiLogModalPath, content, 'utf8');
}

const settingsRoutePath = 'src/app/api/settings/route.ts';
if (fs.existsSync(settingsRoutePath)) {
  let content = fs.readFileSync(settingsRoutePath, 'utf8');
  content = content.replace(/import \{ eq, and \} from 'drizzle-orm';/, "import { eq } from 'drizzle-orm';");
  fs.writeFileSync(settingsRoutePath, content, 'utf8');
}

const cctvPath = 'src/app/(dashboard)/cctv/page.tsx';
if (fs.existsSync(cctvPath)) {
  let content = fs.readFileSync(cctvPath, 'utf8');
  // Remove unused eslint-disable directive
  content = content.replace(/\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n/g, '');
  fs.writeFileSync(cctvPath, content, 'utf8');
}
