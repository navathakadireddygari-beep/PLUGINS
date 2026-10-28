import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "pir-inline-flex pir-items-center pir-justify-center pir-rounded-md pir-text-sm pir-font-medium pir-ring-offset-background pir-transition-colors focus-visible:pir-outline-none focus-visible:pir-ring-2 focus-visible:pir-ring-ring focus-visible:pir-ring-offset-2 disabled:pir-pointer-events-none disabled:pir-opacity-50",
  {
    variants: {
      variant: {
        default: "pir-bg-primary pir-text-primary-foreground hover:pir-bg-primary/90",
        destructive:
          "pir-bg-destructive pir-text-destructive-foreground hover:pir-bg-destructive/90",
        outline:
          "pir-border pir-border-input pir-bg-background hover:pir-bg-accent hover:pir-text-accent-foreground",
        secondary:
          "pir-bg-secondary pir-text-secondary-foreground hover:pir-bg-secondary/80",
        ghost: "hover:pir-bg-accent hover:pir-text-accent-foreground",
        link: "pir-text-primary pir-underline-offset-4 hover:pir-underline",
      },
      size: {
        default: "pir-h-10 pir-px-4 pir-py-2",
        sm: "pir-h-9 pir-rounded-md pir-px-3",
        lg: "pir-h-11 pir-rounded-md pir-px-8",
        icon: "pir-h-10 pir-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
