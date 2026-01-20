import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { ReactNode } from "react";

interface FeatureSectionProps {
    title: string;
    description: string;
    imageSrc: string;
    imageAlt: string;
    badgeText: string;
    badgeIcon: any;
    items?: string[];
    reverse?: boolean;
    children?: ReactNode;
    bgMuted?: boolean;
}

export function FeatureSection({
    title,
    description,
    imageSrc,
    imageAlt,
    badgeText,
    badgeIcon: BadgeIcon,
    items,
    reverse = false,
    children,
    bgMuted = false,
}: FeatureSectionProps) {
    return (
        <section className={`px-4 sm:px-6 lg:px-8 py-20 ${bgMuted ? "bg-muted/30" : ""}`}>
            <div className="max-w-7xl mx-auto">
                <div className={`grid lg:grid-cols-2 gap-12 items-center ${reverse ? "lg:flex-row-reverse" : ""}`}>
                    <div className={`space-y-6 ${reverse ? "order-1 lg:order-2" : ""}`}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                            <BadgeIcon className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-semibold text-orange-600">{badgeText}</span>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold">{title}</h2>

                        <p className="text-lg text-muted-foreground">{description}</p>

                        {items && items.length > 0 && (
                            <ul className="space-y-3">
                                {items.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {children}
                    </div>

                    <div className={`${reverse ? "order-2 lg:order-1" : ""}`}>
                        <Image
                            src={imageSrc}
                            alt={imageAlt}
                            width={600}
                            height={400}
                            className="rounded-2xl shadow-xl border border-border"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
