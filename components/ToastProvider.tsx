"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";

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

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            {toasts.length > 0 && (
                <div className="toast-container">
                    {toasts.map((t) => (
                        <div key={t.id} className={`toast toast--${t.type} animate-slide-up`}>
                            <span className="toast__icon">
                                {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
                            </span>
                            <span className="toast__message">{t.message}</span>
                            <button className="toast__close" onClick={() => removeToast(t.id)}>
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}
