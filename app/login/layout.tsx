import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login - Instantly",
    description: "Login to Instantly - Unlimited Cold Email Outreach",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
