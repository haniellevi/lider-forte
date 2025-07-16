import { cn } from "@/lib/utils"
import React from "react"

const Calendar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-3", className)}
    {...props}
  >
    <p className="text-sm text-muted-foreground">Calendar component placeholder</p>
  </div>
))
Calendar.displayName = "Calendar"

export { Calendar }