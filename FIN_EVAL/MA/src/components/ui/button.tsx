import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "mna:group/button mna:inline-flex mna:shrink-0 mna:items-center mna:justify-center mna:rounded-lg mna:border mna:border-transparent mna:bg-clip-padding mna:text-sm mna:font-medium mna:whitespace-nowrap mna:transition-all mna:outline-none mna:select-none mna:focus-visible:border-ring mna:focus-visible:ring-3 mna:focus-visible:ring-ring/50 mna:active:not-aria-[haspopup]:translate-y-px mna:disabled:pointer-events-none mna:disabled:opacity-50 mna:aria-invalid:border-destructive mna:aria-invalid:ring-3 mna:aria-invalid:ring-destructive/20 mna:dark:aria-invalid:border-destructive/50 mna:dark:aria-invalid:ring-destructive/40 mna:[&_svg]:pointer-events-none mna:[&_svg]:shrink-0 mna:[&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "mna:bg-primary mna:text-primary-foreground mna:hover:bg-primary/80",
        outline:
          "mna:border-border mna:bg-background mna:hover:bg-muted mna:hover:text-foreground mna:aria-expanded:bg-muted mna:aria-expanded:text-foreground mna:dark:border-input mna:dark:bg-input/30 mna:dark:hover:bg-input/50",
        secondary:
          "mna:bg-secondary mna:text-secondary-foreground mna:hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] mna:aria-expanded:bg-secondary mna:aria-expanded:text-secondary-foreground",
        ghost:
          "mna:hover:bg-muted mna:hover:text-foreground mna:aria-expanded:bg-muted mna:aria-expanded:text-foreground mna:dark:hover:bg-muted/50",
        destructive:
          "mna:bg-destructive/10 mna:text-destructive mna:hover:bg-destructive/20 mna:focus-visible:border-destructive/40 mna:focus-visible:ring-destructive/20 mna:dark:bg-destructive/20 mna:dark:hover:bg-destructive/30 mna:dark:focus-visible:ring-destructive/40",
        link: "mna:text-primary mna:underline-offset-4 mna:hover:underline",
      },
      size: {
        default:
          "mna:h-8 mna:gap-1.5 mna:px-2.5 mna:has-data-[icon=inline-end]:pr-2 mna:has-data-[icon=inline-start]:pl-2",
        xs: "mna:h-6 mna:gap-1 mna:rounded-[min(var(--radius-md),10px)] mna:px-2 mna:text-xs mna:in-data-[slot=button-group]:rounded-lg mna:has-data-[icon=inline-end]:pr-1.5 mna:has-data-[icon=inline-start]:pl-1.5 mna:[&_svg:not([class*='size-'])]:size-3",
        sm: "mna:h-7 mna:gap-1 mna:rounded-[min(var(--radius-md),12px)] mna:px-2.5 mna:text-[0.8rem] mna:in-data-[slot=button-group]:rounded-lg mna:has-data-[icon=inline-end]:pr-1.5 mna:has-data-[icon=inline-start]:pl-1.5 mna:[&_svg:not([class*='size-'])]:size-3.5",
        lg: "mna:h-9 mna:gap-1.5 mna:px-2.5 mna:has-data-[icon=inline-end]:pr-2 mna:has-data-[icon=inline-start]:pl-2",
        icon: "mna:size-8",
        "icon-xs":
          "mna:size-6 mna:rounded-[min(var(--radius-md),10px)] mna:in-data-[slot=button-group]:rounded-lg mna:[&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "mna:size-7 mna:rounded-[min(var(--radius-md),12px)] mna:in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "mna:size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
