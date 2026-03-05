import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:pointer-events-none";

        const variants = {
            primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 shadow-sm",
            secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-500",
            outline: "border border-gray-300 bg-transparent hover:bg-gray-50 active:bg-gray-100 text-gray-700 focus:ring-gray-500",
            ghost: "bg-transparent hover:bg-blue-50 active:bg-blue-100 text-blue-600 focus:ring-blue-500",
            destructive: "bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 focus:ring-red-500",
        };

        const sizes = {
            sm: "h-9 px-4 text-sm gap-1.5",
            md: "h-12 px-6 text-base gap-2",
            lg: "h-14 px-8 text-lg gap-2.5",
        };

        const variantStyles = variants[variant];
        const sizeStyles = sizes[size];

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
                {...props}
            >
                {isLoading && <Loader2 className="animate-spin" size={size === 'sm' ? 16 : 20} />}
                {!isLoading && children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
