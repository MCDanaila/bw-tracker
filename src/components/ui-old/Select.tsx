import React, { forwardRef } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { label: string; value: string | number }[];
    error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', label, options, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    className={`
            w-full px-4 py-2.5 bg-white border rounded-xl outline-none transition-shadow
            focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:bg-gray-50
            appearance-none
            ${error
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                        }
            ${className}
          `}
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: `right 0.5rem center`,
                        backgroundRepeat: `no-repeat`,
                        backgroundSize: `1.5em 1.5em`
                    }}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="mt-1 text-xs text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';

export { Select };
