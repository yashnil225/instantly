const fs = require('fs');
const path = require('path');

function getFiles(dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getFiles(fullPath));
        } else if (entry.isFile() && entry.name === 'route.ts') {
            files.push(fullPath);
        }
    }
    return files;
}

const apiDir = path.join(process.cwd(), 'app', 'api');
const routeFiles = getFiles(apiDir);

console.log(`Auditing ${routeFiles.length} route.ts files...`);

for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(process.cwd(), file);

    // Check if it's a dynamic route (contains [ in path)
    if (file.includes('[') && file.includes(']')) {
        const lines = content.split('\n');

        // 1. Check function signatures for Promise
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('export async function') && line.includes('params')) {
                if (!line.includes('Promise')) {
                    console.log(`[SIGNATURE] ${relativePath}:${i + 1} -> Missing Promise`);
                    console.log(`  ${line.trim()}`);
                }
            }
        }

        // 2. Check for params usage without await
        // Look for common patterns: params.id, params.leadId, etc.
        // We only care if 'params' is a Promise (which it should be in Next 15/16)
        if (content.includes('params') && !content.includes('await params') && !content.includes('await context.params') && !content.includes('await prop.params')) {
            // This might be a false positive if params is not used or destructured in signature
            // but let's check if it's actually used in the body
            const bodyLines = lines.filter(l => l.includes('params.') || l.includes('params['))
            if (bodyLines.length > 0) {
                console.log(`[USAGE] ${relativePath} -> params used without await`);
            }
        }
    }
}
