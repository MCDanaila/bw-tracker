import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="grid gap-1 w-full">
        {label && (
          <Label className={cn("flex justify-start text-muted-foreground", error && "text-destructive")}>
            {label}
            {props.value !== undefined && <span className="ml-2 font-bold text-foreground">{props.value}</span>}
          </Label>
        )}
        <input
          type="range"
          ref={ref}
          className={cn(
            "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary",
            className
          )}
          {...props}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
          <span>{props.min || 0}</span>
          <span>{props.max || 100}</span>
        </div>
        {error && <p className="text-[0.8rem] font-medium text-destructive">{error}</p>}
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
