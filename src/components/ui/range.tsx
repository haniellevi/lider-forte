"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"
import { Label } from "./label"

export interface RangeProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string
  description?: string
  showValue?: boolean
  showMinMax?: boolean
  formatValue?: (value: number) => string
  variant?: "default" | "success" | "warning" | "danger"
  size?: "sm" | "default" | "lg"
}

const Range = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  RangeProps
>(({ 
  className, 
  label,
  description,
  showValue = false,
  showMinMax = false,
  formatValue = (value) => value.toString(),
  variant = "default",
  size = "default",
  min = 0,
  max = 100,
  value,
  defaultValue,
  onValueChange,
  ...props 
}, ref) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || [min])
  const currentValue = value || internalValue

  const handleValueChange = (newValue: number[]) => {
    setInternalValue(newValue)
    onValueChange?.(newValue)
  }

  const variantClasses = {
    default: {
      track: "bg-secondary",
      range: "bg-primary",
      thumb: "border-primary bg-background focus-visible:ring-ring"
    },
    success: {
      track: "bg-green-100 dark:bg-green-900/20",
      range: "bg-green-500",
      thumb: "border-green-500 bg-background focus-visible:ring-green-500"
    },
    warning: {
      track: "bg-yellow-100 dark:bg-yellow-900/20", 
      range: "bg-yellow-500",
      thumb: "border-yellow-500 bg-background focus-visible:ring-yellow-500"
    },
    danger: {
      track: "bg-red-100 dark:bg-red-900/20",
      range: "bg-red-500", 
      thumb: "border-red-500 bg-background focus-visible:ring-red-500"
    }
  }

  const sizeClasses = {
    sm: {
      track: "h-1",
      thumb: "h-3 w-3"
    },
    default: {
      track: "h-2",
      thumb: "h-5 w-5"
    },
    lg: {
      track: "h-3",
      thumb: "h-6 w-6"
    }
  }

  const classes = variantClasses[variant]
  const sizes = sizeClasses[size]

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
            </Label>
          )}
          {showValue && (
            <span className="text-sm font-medium text-muted-foreground">
              {Array.isArray(currentValue) 
                ? currentValue.length === 1 
                  ? formatValue(currentValue[0])
                  : `${formatValue(currentValue[0])} - ${formatValue(currentValue[currentValue.length - 1])}`
                : formatValue(currentValue as number)
              }
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <SliderPrimitive.Root
          ref={ref}
          className={cn(
            "relative flex w-full touch-none select-none items-center",
            props.disabled && "cursor-not-allowed opacity-50"
          )}
          min={min}
          max={max}
          value={currentValue}
          onValueChange={handleValueChange}
          {...props}
        >
          <SliderPrimitive.Track
            className={cn(
              "relative w-full grow overflow-hidden rounded-full",
              sizes.track,
              classes.track
            )}
          >
            <SliderPrimitive.Range 
              className={cn(
                "absolute h-full",
                classes.range
              )} 
            />
          </SliderPrimitive.Track>
          {currentValue.map((_, index) => (
            <SliderPrimitive.Thumb
              key={index}
              className={cn(
                "block rounded-full border-2 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                sizes.thumb,
                classes.thumb
              )}
            />
          ))}
        </SliderPrimitive.Root>
        
        {showMinMax && (
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatValue(min)}</span>
            <span>{formatValue(max)}</span>
          </div>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
})

Range.displayName = "Range"

// Dual range component for selecting a range between two values
export interface DualRangeProps extends Omit<RangeProps, 'defaultValue' | 'value' | 'onValueChange'> {
  defaultValue?: [number, number]
  value?: [number, number]
  onValueChange?: (value: [number, number]) => void
  step?: number
  minDistance?: number
}

const DualRange = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  DualRangeProps
>(({ 
  defaultValue = [25, 75],
  value,
  onValueChange,
  minDistance = 1,
  min = 0,
  max = 100,
  step = 1,
  ...props 
}, ref) => {
  const [internalValue, setInternalValue] = React.useState<[number, number]>(defaultValue)
  const currentValue = value || internalValue

  const handleValueChange = (newValue: number[]) => {
    if (newValue.length === 2) {
      let [newMin, newMax] = newValue as [number, number]
      
      // Ensure minimum distance between values
      if (newMax - newMin < minDistance) {
        if (newMin === currentValue[0]) {
          // User moved the max handle, adjust min
          newMin = Math.max(min, newMax - minDistance)
        } else {
          // User moved the min handle, adjust max
          newMax = Math.min(max, newMin + minDistance)
        }
      }
      
      const finalValue: [number, number] = [newMin, newMax]
      setInternalValue(finalValue)
      onValueChange?.(finalValue)
    }
  }

  return (
    <Range
      ref={ref}
      min={min}
      max={max}
      step={step}
      value={currentValue}
      onValueChange={handleValueChange}
      {...props}
    />
  )
})

DualRange.displayName = "DualRange"

export { Range, DualRange }