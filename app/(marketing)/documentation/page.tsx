import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DocumentationPage() {
    return (
        <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    Documentation
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                    Learn how to use Instantly to its full potential
                </p>
                <p className="text-muted-foreground mb-8">
                    This page is under construction. Check back soon for comprehensive documentation.
                </p>
                <Link href="/">
                    <Button>Back to Home</Button>
                </Link>
            </div>
        </div>
    )
}
