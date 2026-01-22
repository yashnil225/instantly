import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, User, Tag } from "lucide-react"
import Image from "next/image"

const posts = [
    {
        title: "How to Increase Your Email Open Rates by 45% in 30 Days",
        description: "Discover the proven strategies and real-world examples we used to help our clients double their engagement.",
        date: "May 12, 2024",
        author: "Alex Rivers",
        category: "Strategy",
        image: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?q=80&w=800&auto=format&fit=crop"
    },
    {
        title: "The Ultimate Guide to Cold Email Deliverability",
        description: "Everything you need to know about SPF, DKIM, DMARC, and how to stay out of the spam folder.",
        date: "May 8, 2024",
        author: "Sarah Chen",
        category: "Deliverability",
        image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop"
    },
    {
        title: "5 Sales Follow-up Templates That Actually Get a Response",
        description: "Stop sending \"just checking in\" emails. Use these psychologically proven templates instead.",
        date: "May 5, 2024",
        author: "Michael Scott",
        category: "Sales",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop"
    }
]

export default function BlogPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <section className="px-4 sm:px-6 lg:px-8 py-20 bg-muted/30 border-b border-border">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Blog</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Insights, strategies, and tips to help you master email tracking and sales outreach.
                    </p>
                </div>
            </section>

            <section className="px-4 sm:px-6 lg:px-8 py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {posts.map((post, index) => (
                            <div key={index} className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                                <div className="relative h-48 overflow-hidden">
                                    <Image 
                                        src={post.image} 
                                        alt={post.title} 
                                        fill 
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        {post.category}
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {post.date}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {post.author}
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold group-hover:text-indigo-600 transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {post.description}
                                    </p>
                                    <Button variant="link" className="p-0 h-auto text-indigo-600">
                                        Read More <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
