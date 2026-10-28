import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "pir-flex pir-h-10 pir-w-full pir-rounded-md pir-border pir-border-input pir-bg-background pir-px-3 pir-py-2 pir-text-sm pir-ring-offset-background file:pir-border-0 file:pir-bg-transparent file:pir-text-sm file:pir-font-medium placeholder:pir-text-muted-foreground focus-visible:pir-outline-none focus-visible:pir-ring-2 focus-visible:pir-ring-ring focus-visible:pir-ring-offset-2 disabled:pir-cursor-not-allowed disabled:pir-opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
