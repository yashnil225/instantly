const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync('scratch/all_source_files.json', 'utf8'));
const files = raw.map(f => f.split(path.sep).join('/'));

const projectFiles = files.filter(f => 
  !f.startsWith('scratch/') && 
  !f.startsWith('scripts/') && 
  !f.startsWith('Neverbounce Clone/') &&
  !f.includes('dist/') &&
  !f.endsWith('.d.ts') &&
  !f.includes('inspect_events') &&
  !f.includes('prisma/migrations')
);

console.log('Project core files count:', projectFiles.length);

const categories = {
  'API Routes (app/api)': projectFiles.filter(f => f.startsWith('app/api/')),
  'App Pages & Layouts (app/)': projectFiles.filter(f => f.startsWith('app/') && !f.startsWith('app/api/')),
  'Core Backend Services & Engine (lib/)': projectFiles.filter(f => f.startsWith('lib/')),
  'Components & UI (components/)': projectFiles.filter(f => f.startsWith('components/')),
  'Hooks & Contexts (hooks/ & contexts/)': projectFiles.filter(f => f.startsWith('hooks/') || f.startsWith('contexts/')),
  'MCP Server (mcp-server/src/)': projectFiles.filter(f => f.startsWith('mcp-server/src/')),
  'Database, Types & Configs': projectFiles.filter(f => f.startsWith('prisma/') || f.startsWith('types/') || !f.includes('/') || f.startsWith('libs/'))
};

for (const [cat, list] of Object.entries(categories)) {
  console.log(cat + ':', list.length);
}
fs.writeFileSync('scratch/categorized_files.json', JSON.stringify(categories, null, 2));
