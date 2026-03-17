import { useState, useEffect, useId } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"

export interface StepperProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    className?: string;
    disabled?: boolean;
}

export function Stepper({
    value,
    onChange,
    min = 0,
    max = 999,
    step = 1,
    label,
    className,
    disabled = false,
}: StepperProps) {
    const [inputValue, setInputValue] = useState(Number(value).toFixed(step < 1 ? 1 : 0));

    useEffect(() => {
        setInputValue(Number(value).toFixed(step < 1 ? 1 : 0));
    }, [value, step]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleBlur = () => {
        let parsed = parseFloat(inputValue);
        if (isNaN(parsed)) {
            parsed = min;
        }
        const clamped = Math.max(min, Math.min(max, parsed));
        if (clamped !== value) {
            onChange(clamped);
        } else {
            setInputValue(Number(clamped).toFixed(step < 1 ? 1 : 0));
        }
    };

    const handleDecrement = () => {
        if (value > min) {
            onChange(Math.max(min, value - step));
        }
    };

    const handleIncrement = () => {
        if (value < max) {
            onChange(Math.min(max, value + step));
        }
    };

    const stepperId = `stepper-${useId()}`;
    const decrementLabel = label ? `Decrease ${label}` : "Decrease value";
    const incrementLabel = label ? `Increase ${label}` : "Increase value";

    return (
        <div className={cn("flex flex-col gap-2 w-full", className)}>
            {label && (
                <span id={`${stepperId}-label`} className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </span>
            )}
            <div className="flex items-center w-full h-10 rounded-md border border-input bg-background overflow-hidden relative focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-full rounded-none px-3 bg-muted/50 hover:bg-muted text-muted-foreground w-12"
                    onClick={handleDecrement}
                    disabled={disabled || value <= min}
                    aria-label={decrementLabel}
                >
                    <Minus size={16} />
                </Button>
                <input
                    type="number"
                    step={step}
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    aria-label={label || "Stepper value"}
                    aria-labelledby={label ? `${stepperId}-label` : undefined}
                    className="flex-1 w-full font-semibold text-lg bg-transparent text-center border-x border-input focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-full rounded-none px-3 bg-muted/50 hover:bg-muted text-muted-foreground w-12"
                    onClick={handleIncrement}
                    disabled={disabled || value >= max}
                    aria-label={incrementLabel}
                >
                    <Plus size={16} />
                </Button>
            </div>
        </div>
    );
}
