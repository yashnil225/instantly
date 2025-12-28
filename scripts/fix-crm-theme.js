const fs = require('fs');

const filePath = 'c:/Users/Yash/OneDrive/Desktop/Workspaces/Instantly.ai/instantly/app/crm/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace dark mode hardcoded colors with theme-aware classes
const replacements = [
    // Text colors
    [/text-white(?!\/)/g, 'text-foreground'],
    [/text-gray-300/g, 'text-foreground'],
    [/text-gray-400/g, 'text-muted-foreground'],
    [/text-gray-500/g, 'text-muted-foreground'],
    [/text-gray-600/g, 'text-muted-foreground'],
    [/text-gray-700/g, 'text-muted-foreground'],
    [/text-gray-800/g, 'text-muted-foreground'],
    // Border colors
    [/border-white\/5/g, 'border-border'],
    [/border-white\/10/g, 'border-border'],
    // Background colors
    [/bg-\[#0f0f13\]/g, 'bg-card'],
    [/bg-\[#070709\]/g, 'bg-background'],
    [/bg-\[#0a0a0a\]/g, 'bg-background'],
    [/bg-\[#1a1a1a\]/g, 'bg-card'],
    [/bg-\[#1e1e24\]/g, 'bg-card'],
    [/bg-\[#161616\]/g, 'bg-card'],
    [/bg-white\/5/g, 'bg-muted'],
    [/bg-white\/\[0\.02\]/g, 'bg-muted'],
    // Hover states
    [/hover:bg-white\/\[0\.02\]/g, 'hover:bg-muted/50'],
    [/hover:text-white/g, 'hover:text-foreground'],
    [/hover:text-gray-300/g, 'hover:text-foreground'],
];

for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done! Replaced hardcoded dark mode colors with theme-aware classes.');
