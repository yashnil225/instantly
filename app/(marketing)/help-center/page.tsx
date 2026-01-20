import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HelpCenterPage() {
    return (
        <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    Help Center
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                    Get help and support for using Instantly
                </p>
                <p className="text-muted-foreground mb-8">
                    This page is under construction. For immediate support, please contact us.
                </p>
                <Link href="/contact">
                    <Button className="mr-4">Contact Us</Button>
                </Link>
                <Link href="/">
                    <Button variant="outline">Back to Home</Button>
                </Link>
            </div>
        </div>
    )
}
