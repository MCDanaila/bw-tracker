import { Loader2 } from 'lucide-react'

interface PageSpinnerProps {
  message?: string
}

export function PageSpinner({ message }: PageSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
