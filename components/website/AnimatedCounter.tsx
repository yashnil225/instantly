"use client"

import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"

interface AnimatedCounterProps {
    value: number
    duration?: number
    prefix?: string
    suffix?: string
    decimals?: number
}

export function AnimatedCounter({
    value,
    duration = 2000,
    prefix = "",
    suffix = "",
    decimals = 0
}: AnimatedCounterProps) {
    const [count, setCount] = useState(0)
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    useEffect(() => {
        if (!inView) return

        let startTimestamp: number | null = null
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp
            const progress = Math.min((timestamp - startTimestamp) / duration, 1)

            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3)

            setCount(easeProgress * value)
            if (progress < 1) {
                window.requestAnimationFrame(step)
            }
        }
        window.requestAnimationFrame(step)
    }, [inView, value, duration])

    return (
        <span ref={ref}>
            {prefix}
            {count.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            })}
            {suffix}
        </span>
    )
}
