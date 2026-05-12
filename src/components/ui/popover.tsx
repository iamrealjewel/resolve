"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  asChild = false,
  ...props
}: PopoverPrimitive.Trigger.Props & { asChild?: boolean }) {
  const { asChild: _, ...cleanProps } = props as any

  if (asChild && React.isValidElement(props.children)) {
    const isLink = (props.children as any).type === "a" || (props.children as any).type?.displayName === "Link" || (props.children as any).props?.href;
    return (
      <PopoverPrimitive.Trigger
        nativeButton={!isLink}
        render={({ children: _, ...renderProps }) => {
          const child = props.children as any
          return React.cloneElement(child, {
            ...renderProps,
            className: cn(child.props?.className),
          } as any)
        }}
        {...cleanProps}
      />
    )
  }

  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...cleanProps} />
}

function PopoverPortal({ ...props }: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props & {
  align?: PopoverPrimitive.Positioner.Props["align"];
  side?: PopoverPrimitive.Positioner.Props["side"];
  sideOffset?: PopoverPrimitive.Positioner.Props["sideOffset"];
}) {
  return (
    <PopoverPortal>
      <PopoverPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50 w-(--anchor-width) max-w-(--anchor-width)"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "relative isolate z-50 rounded-none bg-popover p-4 text-popover-foreground shadow-xl border ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPortal>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverPortal }
