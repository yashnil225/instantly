import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up - Instantly",
    description: "Create an Instantly account - Unlimited Cold Email Outreach",
};

export default function SignupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
