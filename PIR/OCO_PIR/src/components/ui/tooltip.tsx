import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "pir-z-50 pir-overflow-hidden pir-rounded-md pir-border pir-bg-popover pir-px-3 pir-py-1.5 pir-text-sm pir-text-popover-foreground pir-shadow-md pir-animate-in pir-fade-in-0 pir-zoom-in-95 data-[state=closed]:pir-animate-out data-[state=closed]:pir-fade-out-0 data-[state=closed]:pir-zoom-out-95 data-[side=bottom]:pir-slide-in-from-top-2 data-[side=left]:pir-slide-in-from-right-2 data-[side=right]:pir-slide-in-from-left-2 data-[side=top]:pir-slide-in-from-bottom-2 pir-origin-[--radix-tooltip-content-transform-origin]",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
