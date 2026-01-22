import { LucideIcon, CheckCircle2 } from "lucide-react";

interface FeatureCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    items?: string[];
    iconColor?: string;
    iconBgColor?: string;
    className?: string;
}

export function FeatureCard({
    title,
    description,
    icon: Icon,
    items,
    iconColor = "text-indigo-600",
    iconBgColor = "bg-indigo-500/10",
    className = "",
}: FeatureCardProps) {
    return (
        <div className={`p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow ${className}`}>
            <div className={`w-12 h-12 rounded-lg ${iconBgColor} flex items-center justify-center mb-4`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground mb-4">{description}</p>
            {items && items.length > 0 && (
                <ul className="space-y-2">
                    {items.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
