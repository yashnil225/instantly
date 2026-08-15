import { z } from "zod";
export declare const getSequencesSchema: {
    campaignId: z.ZodString;
};
export declare function handleGetSequences(args: {
    campaignId: string;
}): Promise<{
    campaignId: string;
    totalSteps: number;
    sequences: {
        id: string;
        stepNumber: number;
        dayGap: number;
        variants: {
            id: string;
            label: string | null;
            subject: string | null;
            body: string;
            weight: number;
            enabled: boolean;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }[];
}>;
export declare const createSequenceStepSchema: {
    campaignId: z.ZodString;
    dayGap: z.ZodDefault<z.ZodNumber>;
    subject: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    variantLabel: z.ZodDefault<z.ZodString>;
};
export declare function handleCreateSequenceStep(args: {
    campaignId: string;
    dayGap?: number;
    subject?: string;
    body: string;
    variantLabel?: string;
}): Promise<{
    success: boolean;
    message: string;
    sequenceId: string;
    stepNumber: number;
    sequence: {
        variants: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            subject: string | null;
            body: string;
            sequenceId: string;
            label: string | null;
            weight: number;
            enabled: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        stepNumber: number;
        subject: string | null;
        body: string | null;
        dayGap: number;
    };
}>;
export declare const updateSequenceVariantSchema: {
    variantId: z.ZodString;
    subject: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    weight: z.ZodOptional<z.ZodNumber>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    label: z.ZodOptional<z.ZodString>;
};
export declare function handleUpdateSequenceVariant(args: {
    variantId: string;
    subject?: string;
    body?: string;
    weight?: number;
    enabled?: boolean;
    label?: string;
}): Promise<{
    success: boolean;
    message: string;
    variant: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string | null;
        body: string;
        sequenceId: string;
        label: string | null;
        weight: number;
        enabled: boolean;
    };
}>;
export declare const deleteSequenceStepSchema: {
    sequenceId: z.ZodString;
};
export declare function handleDeleteSequenceStep(args: {
    sequenceId: string;
}): Promise<{
    success: boolean;
    message: string;
}>;
