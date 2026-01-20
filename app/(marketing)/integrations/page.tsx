import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function IntegrationsPage() {
    return (
        <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    Integrations
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                    Connect Instantly with your favorite tools and platforms
                </p>
                <p className="text-muted-foreground mb-8">
                    This page is under construction. Check back soon for our integration partners.
                </p>
                <Link href="/">
                    <Button>Back to Home</Button>
                </Link>
            </div>
        </div>
    )
}
