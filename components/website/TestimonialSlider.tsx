"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import Image from "next/image"

const testimonials = [
    {
        quote: "Instantly has completely transformed our sales outreach. The tracking accuracy is unparalleled.",
        author: "Sarah Jenkins",
        role: "Head of Sales",
        company: "TechFlow",
        avatar: "https://i.pravatar.cc/150?u=sarah"
    },
    {
        quote: "The real-time notifications allow us to follow up with leads the exact second they engage.",
        author: "Michael Chen",
        role: "Marketing Director",
        company: "GrowthLabs",
        avatar: "https://i.pravatar.cc/150?u=michael"
    },
    {
        quote: "Best email tracking tool we've ever used. Simple, powerful, and it just works.",
        author: "Emma Rodriguez",
        role: "Founder",
        company: "PixelPerfect",
        avatar: "https://i.pravatar.cc/150?u=emma"
    }
]

export function TestimonialSlider() {
    const [activeIndex, setActiveIndex] = useState(0)

    const next = () => setActiveIndex((prev) => (prev + 1) % testimonials.length)
    const prev = () => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)

    useEffect(() => {
        const interval = setInterval(next, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="relative max-w-4xl mx-auto px-4">
            <div className="overflow-hidden relative min-h-[300px] flex items-center justify-center">
                {testimonials.map((testimonial, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out flex flex-col items-center text-center px-8 md:px-16 ${index === activeIndex ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                            } ${index < activeIndex ? "-translate-x-8" : ""}`}
                        style={{ display: index === activeIndex ? "flex" : "none" }}
                    >
                        <Quote className="h-12 w-12 text-indigo-500/20 mb-6" />
                        <p className="text-xl md:text-2xl font-medium leading-relaxed mb-8">
                            &quot;{testimonial.quote}&quot;
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500/20">
                                <Image
                                    src={testimonial.avatar}
                                    alt={testimonial.author}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="text-left">
                                <div className="font-bold">{testimonial.author}</div>
                                <div className="text-sm text-muted-foreground">{testimonial.role}, {testimonial.company}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center gap-4 mt-8">
                <button
                    onClick={prev}
                    className="p-2 rounded-full border border-border hover:bg-accent transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                    {testimonials.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-6 bg-indigo-500" : "w-1.5 bg-muted"
                                }`}
                        />
                    ))}
                </div>
                <button
                    onClick={next}
                    className="p-2 rounded-full border border-border hover:bg-accent transition-colors"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}
