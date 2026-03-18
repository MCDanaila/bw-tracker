import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/core/lib/utils"
import { Label } from "@/core/components/ui/label"

export interface InputProps extends React.ComponentProps<"input"> {
  label?: string
  icon?: React.ReactNode
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, icon, error, ...props }, ref) => {
    return (
      <div className="grid gap-1.5 w-full">
        {label && <Label className={error ? "text-destructive" : "text-muted-foreground"}>{label}</Label>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground">{icon}</div>
          )}
          <InputPrimitive
            type={type}
            ref={ref}
            data-slot="input"
            className={cn(
              "h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-9",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[0.8rem] font-medium text-destructive">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
