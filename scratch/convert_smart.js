const fs = require('fs');
const path = require('path');

/**
 * Smart Converter: HTML/JS -> Next.js (TSX)
 * Automates the extraction of UI and logic from production chunks.
 */

// Mapping of numeric module IDs to standard human-readable imports
const MODULE_ID_MAP = {
  '67294': 'react',
  '11163': 'next/router',
  '1662': 'next/link',
  '9008': 'next/head',
  '59499': 'axios',
  '28472': 'feather-icons-react', 
};

function convertHtmlToJsx(html) {
  let jsx = html;

  // 1. Basic conversions
  jsx = jsx.replace(/class=/g, 'className=');
  jsx = jsx.replace(/for=/g, 'htmlFor=');
  jsx = jsx.replace(/onclick=/g, 'onClick=');
  jsx = jsx.replace(/tabindex=/g, 'tabIndex=');

  // 2. Self-closing tags
  const selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];
  selfClosingTags.forEach(tag => {
    const regex = new RegExp(`<${tag}([^>]*[^/])>`, 'gi');
    jsx = jsx.replace(regex, `<${tag}$1 />`);
  });

  // 3. Style strings to objects
  jsx = jsx.replace(/style="([^"]*)"/g, (match, styleString) => {
    const styleObj = styleString.split(';').filter(s => s.trim()).reduce((acc, rule) => {
        const parts = rule.split(':');
        const key = parts[0] ? parts[0].trim() : '';
        const value = parts[1] ? parts[1].trim() : '';
        if (key && value) {
            const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
            acc[camelKey] = value;
        }
        return acc;
    }, {});
    return `style={${JSON.stringify(styleObj)}}`;
  });

  return jsx;
}

function deobfuscateJs(code) {
  let cleanCode = code;

  // Replace common module IDs
  Object.entries(MODULE_ID_MAP).forEach(([id, name]) => {
    const regex = new RegExp(`r\\(${id}\\)`, 'g');
    cleanCode = cleanCode.replace(regex, `require("${name}")`);
  });

  cleanCode = cleanCode.replace(/r\.Z\.axios/g, 'axios');
  cleanCode = cleanCode.replace(/self\.webpackChunk_N_E\.push\(\[[\s\S]*?\{/g, '// Rehydrated Logic\nconst pageLogic = {');

  return cleanCode;
}

function generateNextJsPage(htmlPath, jsPath, outputPath) {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const jsContent = fs.readFileSync(jsPath, 'utf8');

    const jsxBody = convertHtmlToJsx(htmlContent);
    const hydratedJs = deobfuscateJs(jsContent);

    const template = `
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// --- Rehydrated Reference Logic (Generated) ---
/*
${hydratedJs.substring(0, 500)}...
*/

export default function ConvertedPage() {
    return (
        <>
            <Head>
                <title>Instantly Auth Clone</title>
            </Head>
            <main className="instantly-auth-section">
                ${jsxBody}
            </main>
        </>
    );
}
`;

    fs.writeFileSync(outputPath, template);
    process.stdout.write('Successfully generated: ' + outputPath + '\n');
}

const args = process.argv.slice(2);
if (args.length >= 3) {
    generateNextJsPage(args[0], args[1], args[2]);
} else {
    process.stdout.write('Usage: node convert_smart.js <html_path> <js_path> <output_path>\n');
}
