"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
} from "@heroicons/react/24/solid";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = "info") => {
        const id = nextId++;

        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove toast after 10 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 10000);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}

            {toasts.length > 0 && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 w-full px-4">
                    {toasts.map((t) => (
                        <div
                            key={t.id}
                            className={`flex items-center gap-3 px-4 py-3 min-w-[320px] max-w-md rounded-lg shadow-lg text-sm font-medium transition-all
              ${t.type === "success"
                                    ? "bg-emerald-500 text-white"
                                    : t.type === "error"
                                        ? "bg-red-500 text-white"
                                        : "bg-blue-500 text-white"
                                }`}
                        >
                            {/* Icon */}
                            <span className="w-5 h-5 flex items-center">
                                {t.type === "success" && <CheckCircleIcon />}
                                {t.type === "error" && <ExclamationCircleIcon />}
                                {t.type === "info" && <InformationCircleIcon />}
                            </span>

                            {/* Message */}
                            <span className="flex-1">{t.message}</span>

                            {/* Close button */}
                            <button
                                onClick={() => removeToast(t.id)}
                                className="ml-2 text-white/80 hover:text-white text-lg"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}