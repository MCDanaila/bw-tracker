import React, { forwardRef } from 'react';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                        {label}
                        {props.value !== undefined && <span className="ml-2 font-bold text-gray-700">{props.value}</span>}
                    </label>
                )}
                <input
                    type="range"
                    ref={ref}
                    className={`
            w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
            accent-orange-500 hover:accent-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2
            ${className}
          `}
                    {...props}
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
                    <span>{props.min || 0}</span>
                    <span>{props.max || 100}</span>
                </div>
                {error && (
                    <p className="mt-1 text-xs text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Slider.displayName = 'Slider';

export { Slider };
