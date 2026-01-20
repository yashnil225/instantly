import { MarketingHeader } from "@/components/website/MarketingHeader";
import { MarketingFooter } from "@/components/website/MarketingFooter";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <MarketingHeader />
            <main className="flex-grow">{children}</main>
            <MarketingFooter />
        </div>
    );
}
