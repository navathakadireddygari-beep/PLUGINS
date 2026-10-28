import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="pir-toaster pir-group"
      toastOptions={{
        classNames: {
          toast:
            "pir-group pir-toast group-[.pir-toaster]:pir-bg-background group-[.pir-toaster]:pir-text-foreground group-[.pir-toaster]:pir-border-border group-[.pir-toaster]:pir-shadow-lg",
          description: "group-[.pir-toast]:pir-text-muted-foreground",
          actionButton:
            "group-[.pir-toast]:pir-bg-primary group-[.pir-toast]:pir-text-primary-foreground",
          cancelButton:
            "group-[.pir-toast]:pir-bg-muted group-[.pir-toast]:pir-text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
