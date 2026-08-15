import { z } from "zod";
export declare const listTemplatesSchema: {
    category: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
};
export declare function handleListTemplates(args: {
    category?: string;
    search?: string;
}): Promise<{
    total: number;
    templates: {
        id: string;
        name: string;
        category: string | null;
        subject: string;
        body: string;
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[];
}>;
export declare const createTemplateSchema: {
    name: z.ZodString;
    subject: z.ZodString;
    body: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
};
export declare function handleCreateTemplate(args: {
    name: string;
    subject: string;
    body: string;
    category?: string;
    isPublic?: boolean;
}): Promise<{
    success: boolean;
    message: string;
    templateId: string;
    template: {
        id: string;
        name: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        body: string;
        subject: string;
        category: string | null;
        isPublic: boolean;
    };
}>;
export declare const deleteTemplateSchema: {
    templateId: z.ZodString;
};
export declare function handleDeleteTemplate(args: {
    templateId: string;
}): Promise<{
    success: boolean;
    message: string;
}>;
