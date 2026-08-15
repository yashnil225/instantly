export declare const promptsList: {
    name: string;
    description: string;
    arguments: {
        name: string;
        description: string;
        required: boolean;
    }[];
}[];
export declare function getPromptMessages(name: string, args: Record<string, string | undefined>): {
    role: "user";
    content: {
        type: "text";
        text: string;
    };
}[];
