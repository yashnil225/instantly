const fs = require('fs');
const path = require('path');

const categorized = JSON.parse(fs.readFileSync('scratch/categorized_files.json', 'utf8'));

// Function to scan file content and flag common anti-patterns or specific issues
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const findings = [];

    // General checks
    if (content.includes('TODO') || content.includes('FIXME')) {
      findings.push('Contains unfulfilled TODO / FIXME markers');
    }
    if (content.includes('any') && (content.includes(': any') || content.includes('as any'))) {
      findings.push('Uses loose any typing');
    }
    if (content.includes('console.log(')) {
      findings.push('Contains residual console.log debugging output');
    }

    // Specific API checks
    if (filePath.startsWith('app/api/')) {
      const hasSession = content.includes('getServerSession') || content.includes('authOptions') || content.includes('session');
      const hasApiKey = content.includes('api_key') || content.includes('Bearer') || content.includes('x-api-key') || content.includes('validateApiKey');
      const isPublic = filePath.includes('/cron/') || filePath.includes('/tracking/') || filePath.includes('/unsubscribe') || filePath.includes('/auth/');
      
      if (!hasSession && !hasApiKey && !isPublic) {
        findings.push('Missing explicit user session or API key authentication check');
      }
      if (!content.includes('try') || !content.includes('catch')) {
        findings.push('Missing top-level try/catch error handling block');
      }
      if (content.includes('workspaceId') && !content.includes('workspaceMember') && !content.includes('prisma.workspace') && hasSession) {
        findings.push('Queries by workspaceId without verifying caller workspace membership (potential IDOR)');
      }
    }

    // Lib checks
    if (filePath.startsWith('lib/')) {
      if (content.includes('setInterval') || content.includes('setTimeout')) {
        findings.push('Contains in-memory timer intervals susceptible to serverless freezes / memory leaks');
      }
      if (content.includes('new Map()') || content.includes('let ') && content.includes('Cache')) {
        findings.push('Uses in-memory cache variable that desyncs across serverless cold starts or multi-instance clusters');
      }
    }

    // Component / Page checks
    if (filePath.startsWith('components/') || filePath.startsWith('app/')) {
      if (content.includes('dangerouslySetInnerHTML')) {
        findings.push('Uses dangerouslySetInnerHTML without explicit sanitizeHtml sanitization');
      }
      if (content.includes('useEffect') && content.includes('[]') && (content.includes('workspace') || content.includes('campaignId'))) {
        findings.push('Missing reactive dependencies in useEffect (may not update on entity switch)');
      }
      if (content.includes('.length > 0 &&') && !content.includes('Boolean(')) {
        findings.push('Potential 0 rendering glitch via arr.length && <Component />');
      }
      if (content.includes('Math.round') && content.includes('/')) {
        findings.push('Potential division by zero (NaN% or Infinity) in metric calculation');
      }
    }

    return {
      path: filePath,
      lineCount: lines.length,
      findings
    };
  } catch (err) {
    return {
      path: filePath,
      lineCount: 0,
      findings: ['Error reading file: ' + err.message]
    };
  }
}

const auditResults = {};
for (const [cat, files] of Object.entries(categorized)) {
  auditResults[cat] = files.map(analyzeFile);
}

fs.writeFileSync('scratch/audit_results.json', JSON.stringify(auditResults, null, 2));
console.log('Automated baseline audit complete. Saved to scratch/audit_results.json');
