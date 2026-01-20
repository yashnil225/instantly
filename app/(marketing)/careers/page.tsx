import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CareersPage() {
    return (
        <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    Careers
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                    Join our team and help build the future of email outreach
                </p>
                <p className="text-muted-foreground mb-8">
                    This page is under construction. We&apos;re not currently hiring, but check back soon for opportunities.
                </p>
                <Link href="/">
                    <Button>Back to Home</Button>
                </Link>
            </div>
        </div>
    )
}
