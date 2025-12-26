import * as React from "react"

export function Label({ children, htmlFor, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label
            htmlFor={htmlFor}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            {...props}
        >
            {children}
        </label>
    )
}
