import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "pir-flex pir-min-h-[80px] pir-w-full pir-rounded-md pir-border pir-border-input pir-bg-background pir-px-3 pir-py-2 pir-text-sm pir-ring-offset-background placeholder:pir-text-muted-foreground focus-visible:pir-outline-none focus-visible:pir-ring-2 focus-visible:pir-ring-ring focus-visible:pir-ring-offset-2 disabled:pir-cursor-not-allowed disabled:pir-opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
