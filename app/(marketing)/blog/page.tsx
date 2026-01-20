import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function BlogPage() {
    return (
        <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    Blog
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                    Tips, guides, and insights on email outreach and marketing
                </p>
                <p className="text-muted-foreground mb-8">
                    This page is under construction. Check back soon for articles and resources.
                </p>
                <Link href="/">
                    <Button>Back to Home</Button>
                </Link>
            </div>
        </div>
    )
}
