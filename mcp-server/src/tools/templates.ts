import { z } from "zod"
import { prisma } from "../db.js"

export const listTemplatesSchema = {
  category: z.string().optional().describe("Filter templates by category (e.g. 'Outreach', 'Follow-up', 'Breakup')"),
  search: z.string().optional().describe("Search term for template name or subject"),
}

export async function handleListTemplates(args: {
  category?: string
  search?: string
}) {
  const where: any = {}
  if (args.category) where.category = args.category
  if (args.search) {
    where.OR = [
      { name: { contains: args.search } },
      { subject: { contains: args.search } },
      { body: { contains: args.search } },
    ]
  }

  const templates = await prisma.template.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  })

  return {
    total: templates.length,
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      subject: t.subject,
      body: t.body,
      isPublic: t.isPublic,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  }
}

export const createTemplateSchema = {
  name: z.string().min(1).describe("Template name"),
  subject: z.string().min(1).describe("Email subject template (supports variables like {{firstName}})"),
  body: z.string().min(1).describe("Email body template (supports variables like {{firstName}}, {{company}})"),
  category: z.string().optional().describe("Category (e.g., 'Initial Outreach', 'Follow-up', 'Case Study')"),
  isPublic: z.boolean().default(false).describe("Whether the template is public/shared"),
}

export async function handleCreateTemplate(args: {
  name: string
  subject: string
  body: string
  category?: string
  isPublic?: boolean
}) {
  const user = await prisma.user.findFirst()

  const template = await prisma.template.create({
    data: {
      name: args.name,
      subject: args.subject,
      body: args.body,
      category: args.category || "General",
      isPublic: args.isPublic ?? false,
      userId: user?.id,
    },
  })

  return {
    success: true,
    message: `Template '${template.name}' created successfully`,
    templateId: template.id,
    template,
  }
}

export const deleteTemplateSchema = {
  templateId: z.string().describe("Template ID to delete"),
}

export async function handleDeleteTemplate(args: { templateId: string }) {
  await prisma.template.delete({
    where: { id: args.templateId },
  })

  return {
    success: true,
    message: `Template ${args.templateId} deleted successfully`,
  }
}
