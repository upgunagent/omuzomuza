"use client"

import * as React from "react"
// import * as TabsPrimitive from "@radix-ui/react-tabs"
// I don't have radix-ui installed. I should install it or write a custom one.
// The user said Tailwind CSS. I'll write a custom one with Tailwind state to avoid extra deps if possible,
// but radix is standard for accessibility.
// I'll write a simple custom one for now since I didn't install radix.

import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
    activeTab: string
    setActiveTab: (value: string) => void
} | null>(null)

export function Tabs({
    defaultValue,
    className,
    children,
}: {
    defaultValue: string
    className?: string
    children: React.ReactNode
}) {
    const [activeTab, setActiveTab] = React.useState(defaultValue)

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={cn("", className)}>{children}</div>
        </TabsContext.Provider>
    )
}

export function TabsList({
    className,
    children,
}: {
    className?: string
    children: React.ReactNode
}) {
    return (
        <div
            className={cn(
                "inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500",
                className
            )}
        >
            {children}
        </div>
    )
}

export function TabsTrigger({
    value,
    className,
    children,
}: {
    value: string
    className?: string
    children: React.ReactNode
}) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsTrigger must be used within Tabs")

    const isActive = context.activeTab === value

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive
                    ? "bg-white text-slate-950 shadow-sm"
                    : "hover:bg-slate-200 hover:text-slate-900",
                className
            )}
            onClick={() => context.setActiveTab(value)}
        >
            {children}
        </button>
    )
}

export function TabsContent({
    value,
    className,
    children,
}: {
    value: string
    className?: string
    children: React.ReactNode
}) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsContent must be used within Tabs")

    if (context.activeTab !== value) return null

    return (
        <div
            className={cn(
                "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
                className
            )}
        >
            {children}
        </div>
    )
}
