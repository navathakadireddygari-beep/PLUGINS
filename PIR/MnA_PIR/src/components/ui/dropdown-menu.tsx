import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "pir-flex pir-cursor-default pir-select-none pir-items-center pir-rounded-sm pir-px-2 pir-py-1.5 pir-text-sm pir-outline-none focus:pir-bg-accent data-[state=open]:pir-bg-accent",
      inset && "pir-pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="pir-ml-auto pir-h-4 pir-w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "pir-z-50 pir-min-w-[8rem] pir-overflow-hidden pir-rounded-md pir-border pir-bg-popover pir-p-1 pir-text-popover-foreground pir-shadow-lg data-[state=open]:pir-animate-in data-[state=closed]:pir-animate-out data-[state=closed]:pir-fade-out-0 data-[state=open]:pir-fade-in-0 data-[state=closed]:pir-zoom-out-95 data-[state=open]:pir-zoom-in-95 data-[side=bottom]:pir-slide-in-from-top-2 data-[side=left]:pir-slide-in-from-right-2 data-[side=right]:pir-slide-in-from-left-2 data-[side=top]:pir-slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "pir-z-50 pir-min-w-[8rem] pir-overflow-hidden pir-rounded-md pir-border pir-bg-popover pir-p-1 pir-text-popover-foreground pir-shadow-md data-[state=open]:pir-animate-in data-[state=closed]:pir-animate-out data-[state=closed]:pir-fade-out-0 data-[state=open]:pir-fade-in-0 data-[state=closed]:pir-zoom-out-95 data-[state=open]:pir-zoom-in-95 data-[side=bottom]:pir-slide-in-from-top-2 data-[side=left]:pir-slide-in-from-right-2 data-[side=right]:pir-slide-in-from-left-2 data-[side=top]:pir-slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className,textValue, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "pir-relative pir-flex pir-cursor-default pir-select-none pir-items-center pir-rounded-sm pir-px-2 pir-py-1.5 pir-text-sm pir-outline-none pir-transition-colors focus:pir-bg-accent focus:pir-text-accent-foreground data-[disabled]:pir-pointer-events-none data-[disabled]:pir-opacity-50",
      inset && "pir-pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName


const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "pir-relative pir-flex pir-cursor-default pir-select-none pir-items-center pir-rounded-sm pir-py-1.5 pir-pl-8 pir-pr-2 pir-text-sm pir-outline-none pir-transition-colors focus:pir-bg-accent focus:pir-text-accent-foreground data-[disabled]:pir-pointer-events-none data-[disabled]:pir-opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="pir-absolute pir-left-2 pir-flex pir-h-3.5 pir-w-3.5 pir-items-center pir-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="pir-h-4 pir-w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "pir-relative pir-flex pir-cursor-default pir-select-none pir-items-center pir-rounded-sm pir-py-1.5 pir-pl-8 pir-pr-2 pir-text-sm pir-outline-none pir-transition-colors focus:pir-bg-accent focus:pir-text-accent-foreground data-[disabled]:pir-pointer-events-none data-[disabled]:pir-opacity-50",
      className
    )}
    {...props}
  >
    <span className="pir-absolute pir-left-2 pir-flex pir-h-3.5 pir-w-3.5 pir-items-center pir-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="pir-h-2 pir-w-2 pir-fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "pir-px-2 pir-py-1.5 pir-text-sm pir-font-semibold",
      inset && "pir-pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-pir-mx-1 pir-my-1 pir-h-px pir-bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("pir-ml-auto pir-text-xs pir-tracking-widest pir-opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
