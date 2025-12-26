import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface Variant {
    id: string
    subject: string
    body: string
    weight?: number // Optional: for weighted distribution
}

/**
 * Select a variant using A/B testing logic
 * Supports equal distribution or weighted distribution
 */
export function selectVariant(variants: Variant[]): Variant {
    if (variants.length === 0) {
        throw new Error('No variants available')
    }

    if (variants.length === 1) {
        return variants[0]
    }

    // Check if weights are defined
    const hasWeights = variants.some(v => v.weight !== undefined)

    if (hasWeights) {
        // Weighted distribution
        const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 0), 0)
        let random = Math.random() * totalWeight

        for (const variant of variants) {
            random -= (variant.weight || 0)
            if (random <= 0) {
                return variant
            }
        }

        return variants[variants.length - 1]
    } else {
        // Equal distribution
        const randomIndex = Math.floor(Math.random() * variants.length)
        return variants[randomIndex]
    }
}

/**
 * Get A/B test performance for a campaign
 */
export async function getABTestResults(campaignId: string) {
    const sequences = await prisma.sequence.findMany({
        where: { campaignId },
        orderBy: { stepNumber: 'asc' }
    })

    // Group by step number (variants of same step)
    const stepGroups = sequences.reduce((acc, seq) => {
        if (!acc[seq.stepNumber]) {
            acc[seq.stepNumber] = []
        }
        acc[seq.stepNumber].push(seq)
        return acc
    }, {} as Record<number, typeof sequences>)

    const results = []

    for (const [stepNum, variants] of Object.entries(stepGroups)) {
        if (variants.length <= 1) continue // Not an A/B test

        const variantStats = await Promise.all(
            variants.map(async (variant) => {
                // Count sends with this variant's subject
                const events = await prisma.sendingEvent.findMany({
                    where: {
                        campaignId,
                        type: 'sent',
                        metadata: {
                            contains: variant.subject
                        }
                    },
                    include: {
                        lead: true
                    }
                })

                const sent = events.length
                const opened = events.filter(e =>
                    e.lead.status === 'opened' || e.lead.status === 'replied'
                ).length
                const replied = events.filter(e =>
                    e.lead.status === 'replied'
                ).length

                return {
                    variant: variant.subject?.substring(0, 50) || 'Variant',
                    sent,
                    openRate: sent > 0 ? (opened / sent * 100).toFixed(1) : '0',
                    replyRate: sent > 0 ? (replied / sent * 100).toFixed(1) : '0',
                }
            })
        )

        results.push({
            step: parseInt(stepNum),
            variants: variantStats
        })
    }

    return results
}

/**
 * Determine winning variant based on reply rate
 */
export function getWinningVariant(results: Awaited<ReturnType<typeof getABTestResults>>[0]) {
    if (!results.variants || results.variants.length === 0) return null

    return results.variants.reduce((best, current) => {
        const currentRate = parseFloat(current.replyRate)
        const bestRate = parseFloat(best.replyRate)
        return currentRate > bestRate ? current : best
    })
}
