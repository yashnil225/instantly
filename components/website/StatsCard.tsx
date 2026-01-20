import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    label: string;
    value: string;
    icon?: LucideIcon;
    className?: string;
}

export function StatsCard({ label, value, icon: Icon, className = "" }: StatsCardProps) {
    return (
        <div className={`text-center ${className}`}>
            {Icon && <Icon className="h-8 w-8 text-orange-600 mx-auto mb-2" />}
            <div className="text-4xl font-bold text-orange-600 mb-2">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
        </div>
    );
}
