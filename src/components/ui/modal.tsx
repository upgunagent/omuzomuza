"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    className?: string
}

import { createPortal } from "react-dom"

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!isOpen || !mounted) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={cn("relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg animate-in zoom-in-95 duration-200 flex flex-col", className)}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
            </div>
        </div>,
        document.body
    )
}
