export declare const resourcesList: {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}[];
export declare function readResource(uri: string): Promise<{
    uri: string;
    mimeType: string;
    text: string;
}>;
