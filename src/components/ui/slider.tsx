import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const sliderId = id || `slider-${React.useId()}`;
    const errorId = error ? `${sliderId}-error` : undefined;

    return (
      <div className="grid gap-1 w-full">
        {label && (
          <Label htmlFor={sliderId} className={cn("flex justify-start text-muted-foreground", error && "text-destructive")}>
            {label}
            {props.value !== undefined && <span className="ml-2 font-bold text-foreground">{props.value}</span>}
          </Label>
        )}
        <input
          type="range"
          ref={ref}
          id={sliderId}
          className={cn(
            "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary",
            className
          )}
          aria-label={label || "Range slider"}
          aria-valuemin={Number(props.min) || 0}
          aria-valuemax={Number(props.max) || 100}
          aria-valuenow={props.value !== undefined ? Number(props.value) : undefined}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...props}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
          <span>{props.min || 0}</span>
          <span>{props.max || 100}</span>
        </div>
        {error && <p id={errorId} className="text-[0.8rem] font-medium text-destructive">{error}</p>}
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
