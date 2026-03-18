import * as React from "react"
import { cn } from "@/core/lib/utils"
import { Label } from "@/core/components/ui/label"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { label: string; value: string | number }[]
  error?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, ...props }, ref) => {
    return (
      <div className="grid gap-1.5 w-full">
        {label && <Label className={error ? "text-destructive" : "text-muted-foreground"}>{label}</Label>}
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
            error && "border-destructive focus:ring-destructive",
            className
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: `right 0.5rem center`,
            backgroundRepeat: `no-repeat`,
            backgroundSize: `1.5em 1.5em`
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-[0.8rem] font-medium text-destructive">{error}</p>}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
