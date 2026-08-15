import { z } from "zod"
import { prisma } from "../db.js"

export const getSequencesSchema = {
  campaignId: z.string().describe("The ID of the campaign"),
}

export async function handleGetSequences(args: { campaignId: string }) {
  const sequences = await prisma.sequence.findMany({
    where: { campaignId: args.campaignId },
    orderBy: { stepNumber: "asc" },
    include: {
      variants: true,
    },
  })

  return {
    campaignId: args.campaignId,
    totalSteps: sequences.length,
    sequences: sequences.map((s) => ({
      id: s.id,
      stepNumber: s.stepNumber,
      dayGap: s.dayGap,
      variants: s.variants.map((v) => ({
        id: v.id,
        label: v.label,
        subject: v.subject,
        body: v.body,
        weight: v.weight,
        enabled: v.enabled,
      })),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
  }
}

export const createSequenceStepSchema = {
  campaignId: z.string().describe("Target campaign ID"),
  dayGap: z.number().int().min(0).default(1).describe("Number of days to wait after previous step"),
  subject: z.string().optional().describe("Email subject line (can include variables like {{firstName}})"),
  body: z.string().min(1).describe("Email body content (HTML/Text with variables)"),
  variantLabel: z.string().default("Variant A").describe("Label for the primary email variant"),
}

export async function handleCreateSequenceStep(args: {
  campaignId: string
  dayGap?: number
  subject?: string
  body: string
  variantLabel?: string
}) {
  const existingSteps = await prisma.sequence.count({
    where: { campaignId: args.campaignId },
  })

  const stepNumber = existingSteps + 1

  const sequence = await prisma.sequence.create({
    data: {
      campaignId: args.campaignId,
      stepNumber,
      dayGap: args.dayGap ?? 1,
      variants: {
        create: [
          {
            label: args.variantLabel || `Variant A`,
            subject: args.subject || "",
            body: args.body,
            weight: 100,
            enabled: true,
          },
        ],
      },
    },
    include: {
      variants: true,
    },
  })

  return {
    success: true,
    message: `Step ${stepNumber} added to campaign sequences`,
    sequenceId: sequence.id,
    stepNumber: sequence.stepNumber,
    sequence,
  }
}

export const updateSequenceVariantSchema = {
  variantId: z.string().describe("Sequence variant ID"),
  subject: z.string().optional().describe("Updated subject line"),
  body: z.string().optional().describe("Updated email body"),
  weight: z.number().int().min(0).max(100).optional().describe("A/B test traffic distribution weight (0-100)"),
  enabled: z.boolean().optional().describe("Enable or disable this variant"),
  label: z.string().optional().describe("Variant label (e.g. 'Variant B')"),
}

export async function handleUpdateSequenceVariant(args: {
  variantId: string
  subject?: string
  body?: string
  weight?: number
  enabled?: boolean
  label?: string
}) {
  const { variantId, ...data } = args
  const variant = await prisma.sequenceVariant.update({
    where: { id: variantId },
    data,
  })

  return {
    success: true,
    message: `Sequence variant ${variant.id} updated`,
    variant,
  }
}

export const deleteSequenceStepSchema = {
  sequenceId: z.string().describe("ID of the sequence step to remove"),
}

export async function handleDeleteSequenceStep(args: { sequenceId: string }) {
  await prisma.sequence.delete({
    where: { id: args.sequenceId },
  })

  return {
    success: true,
    message: `Sequence step ${args.sequenceId} deleted successfully`,
  }
}
