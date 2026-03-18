import { useId } from "react";
import { cn } from "@/core/lib/utils";
import { Button } from "@/core/components/ui/button";

export interface Option<T> {
    label: React.ReactNode;
    value: T;
    ariaLabel?: string;
}

interface ButtonGroupProps<T> {
    options: readonly Option<T>[];
    value?: T | null;
    onChange: (value: T) => void;
    className?: string;
    label?: string;
}

export function ButtonGroup<T>({ options, value, onChange, className, label }: ButtonGroupProps<T>) {
    const groupId = `button-group-${useId()}`;
    return (
        <div className={cn("flex flex-col gap-2 w-full", className)} role="group" aria-labelledby={label ? `${groupId}-label` : undefined}>
            {label && (
                <span id={`${groupId}-label`} className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </span>
            )}
            <div className="flex flex-wrap gap-2 w-full" role="group" aria-label={label}>
                {options.map((opt, i) => {
                    const isSelected = value === opt.value;
                    return (
                        <Button
                            key={i}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => onChange(opt.value)}
                            className={cn("flex-1 min-w-fit")}
                            aria-pressed={isSelected}
                            aria-label={opt.ariaLabel}
                        >
                            {opt.label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
