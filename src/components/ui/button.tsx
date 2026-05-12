"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Slot } from "@radix-ui/react-slot"
import { buttonVariants } from "./button-variants"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : ButtonPrimitive

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
