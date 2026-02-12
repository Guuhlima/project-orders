import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger";
}

const variantButtons = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-slate-600 text-white hover:bg-slate-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
}

export default function Button({ className, variant = "primary", children, type = "button", ...props}: ButtonProps) {
    return (
        <button
            type={type}
            className={clsx(
                "px-4 py-2 rounded-md font-medium transition-colors",
                variantButtons[variant],
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
}
