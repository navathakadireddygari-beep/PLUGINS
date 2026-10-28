import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "pir-inline-flex pir-items-center pir-rounded-full pir-border pir-px-2.5 pir-py-0.5 pir-text-xs pir-font-semibold pir-transition-colors focus:pir-outline-none focus:pir-ring-2 focus:pir-ring-ring focus:pir-ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "pir-border-transparent pir-bg-primary pir-text-primary-foreground hover:pir-bg-primary/80",
        secondary:
          "pir-border-transparent pir-bg-secondary pir-text-secondary-foreground hover:pir-bg-secondary/80",
        destructive:
          "pir-border-transparent pir-bg-destructive pir-text-destructive-foreground hover:pir-bg-destructive/80",
        outline: "pir-text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants }
