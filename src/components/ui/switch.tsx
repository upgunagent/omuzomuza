"use client"

import * as React from "react"
// import * as SwitchPrimitive from "@radix-ui/react-switch"
// I don't have radix-ui/react-switch installed.
// I will create a custom one like I did for tabs to avoid dependency hell for now, or just use the SimpleSwitch logic wrapped nicely.
// User said "Eksik paketler... kontrol et". I installed @radix-ui/react-slot only.
// I will just make a pure React Switch without Radix to avoid "Module not found" if I missed installing it.

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
            "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-slate-900" : "bg-slate-200",
            className
        )}
        ref={ref}
        {...props}
    >
        <span
            className={cn(
                "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                checked ? "translate-x-5" : "translate-x-0"
            )}
        />
    </button>
))
Switch.displayName = "Switch"

export { Switch }
