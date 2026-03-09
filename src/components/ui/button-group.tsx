import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Option<T> {
    label: React.ReactNode;
    value: T;
}

interface ButtonGroupProps<T> {
    options: readonly Option<T>[];
    value?: T | null;
    onChange: (value: T) => void;
    className?: string;
    label?: string;
}

export function ButtonGroup<T>({ options, value, onChange, className, label }: ButtonGroupProps<T>) {
    return (
        <div className={cn("flex flex-col gap-2 w-full", className)}>
            {label && (
                <span className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </span>
            )}
            <div className="flex flex-wrap gap-2 w-full">
                {options.map((opt, i) => {
                    const isSelected = value === opt.value;
                    return (
                        <Button
                            key={i}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => onChange(opt.value)}
                            className={cn("flex-1 min-w-fit")}
                        >
                            {opt.label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
