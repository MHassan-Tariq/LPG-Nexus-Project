"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "bg-green-50 border-green-200 text-green-800 [&>svg]:text-green-600",
          error: "bg-red-50 border-red-200 text-red-800 [&>svg]:text-red-600",
          warning: "bg-yellow-50 border-yellow-200 text-yellow-800 [&>svg]:text-yellow-600",
          info: "bg-blue-50 border-blue-200 text-blue-800 [&>svg]:text-blue-600",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

