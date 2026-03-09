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

    return (
        <div className={cn("flex flex-col gap-2 w-full", className)}>
            {label && (
                <span className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                >
                    <Minus size={16} />
                </Button>
                <div className="flex-1 flex items-center justify-center font-semibold text-lg bg-transparent text-center border-x border-input">
                    {Number(value).toFixed(step < 1 ? 1 : 0)}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-full rounded-none px-3 bg-muted/50 hover:bg-muted text-muted-foreground w-12"
                    onClick={handleIncrement}
                    disabled={disabled || value >= max}
                >
                    <Plus size={16} />
                </Button>
            </div>
        </div>
    );
}
