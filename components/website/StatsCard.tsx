import { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

interface StatsCardProps {
    label: string;
    value: string;
    icon?: LucideIcon;
    className?: string;
}

export function StatsCard({ label, value, icon: Icon, className = "" }: StatsCardProps) {
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
    const suffix = value.replace(/[0-9.]/g, "");
    const decimals = value.includes(".") ? value.split(".")[1].length : 0;

    return (
        <div className={`text-center group p-4 rounded-xl transition-all duration-300 hover:scale-105 ${className}`}>
            {Icon && <Icon className="h-8 w-8 text-indigo-600 mx-auto mb-2 group-hover:animate-bounce" />}
            <div className="text-4xl font-bold text-indigo-600 mb-2">
                <AnimatedCounter value={numericValue} suffix={suffix} decimals={decimals} />
            </div>
            <div className="text-sm text-muted-foreground font-medium">{label}</div>
        </div>
    );
}
