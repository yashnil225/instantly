import { Button } from "@/components/ui/button";
import { CheckCircle2, Users } from "lucide-react";
import Link from "next/link";

interface CTASectionProps {
    title: string;
    description: string;
    buttonText: string;
    onButtonClick?: () => void;
    showInput?: boolean;
    href?: string;
}

export function CTASection({
    title,
    description,
    buttonText,
    showInput = true,
    href = "/signup",
}: CTASectionProps) {
    return (
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-indigo-900 to-indigo-800 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 mb-20 shadow-2xl">
            <div className="max-w-4xl mx-auto text-center space-y-8">
                <h2 className="text-3xl md:text-5xl font-bold">{title}</h2>
                <p className="text-xl text-indigo-100">{description}</p>

                {showInput ? (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="px-6 py-3 rounded-lg w-full sm:w-96 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <Link href={href} className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8 w-full"
                            >
                                {buttonText}
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <Link href={href}>
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8"
                        >
                            {buttonText}
                        </Button>
                    </Link>
                )}

                <div className="flex items-center justify-center gap-8 pt-4 text-green-100">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <span className="text-sm">5,000+ users</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm">No credit card required</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
