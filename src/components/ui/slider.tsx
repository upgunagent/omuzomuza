"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Simple Range Slider Component
// Note: Authentic dual-thumb slider is complex without a library like Radix UI. 
// For this MVP, we will use a standard single-thumb or implement a simulated dual-thumb if needed.
// However, the page implementation used `value={ageRange[1]}` implying single thumb control for max age 
// OR it expects a layout. 
// Let's stick to a simple input[type=range] wrapper for now that accepts standard props.

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    // empty for now, inherit standard input props
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, ...props }, ref) => {
        return (
            <input
                type="range"
                className={cn(
                    "w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1498e0]",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Slider.displayName = "Slider";

export { Slider };
