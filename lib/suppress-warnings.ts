/**
 * Suppresses Node.js [DEP0169] DeprecationWarning (url.parse deprecation)
 * Triggered by third-party packages in Node.js 22/24.
 */
if (typeof process !== 'undefined' && process.emitWarning) {
    const originalEmitWarning = process.emitWarning
    process.emitWarning = function (warning: any, ...args: any[]) {
        if (typeof warning === 'string' && (warning.includes('DEP0169') || warning.includes('url.parse'))) {
            return
        }
        if (warning && typeof warning === 'object') {
            if (
                (warning as any).code === 'DEP0169' ||
                (warning.name === 'DeprecationWarning' && warning.message && warning.message.includes('url.parse'))
            ) {
                return
            }
        }
        return (originalEmitWarning as any).apply(process, [warning, ...args])
    }
}

export {}
