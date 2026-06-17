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
    content = content.replace(/catch \(error\)/g, 'catch (_error)');
    
    // fix any types
    if (f.includes('feeds/route.ts') || f.includes('health/route.ts')) {
       content = content.replace(/: any/g, ': unknown');
    }

    if (f.includes('settings/route.ts')) {
       content = content.replace(/, and } from 'drizzle-orm';/, " } from 'drizzle-orm';");
    }

    fs.writeFileSync(p, content, 'utf8');
  }
}

const aiLogModalPath = 'src/components/ui/AiLogModal.tsx';
if (fs.existsSync(aiLogModalPath)) {
  let content = fs.readFileSync(aiLogModalPath, 'utf8');
  content = content.replace(/: any/g, ': unknown');
  fs.writeFileSync(aiLogModalPath, content, 'utf8');
}
