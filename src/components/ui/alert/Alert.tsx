import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import React from "react";
import { AlertErrorIcon, AlertSuccessIcon, AlertWarningIcon } from "./icons";

const alertVariants = cva(
  "flex gap-5 w-full rounded-[10px] border-l-6 px-7 py-8 dark:bg-opacity-30 md:p-9",
  {
    variants: {
      variant: {
        success: "border-green bg-green-light-7 dark:bg-[#1B1B24]",
        warning: "border-[#FFB800] bg-[#FEF5DE] dark:bg-[#1B1B24]",
        error: "border-red-light bg-red-light-5 dark:bg-[#1B1B24]",
        destructive: "border-red-light bg-red-light-5 dark:bg-[#1B1B24]",
      },
    },
    defaultVariants: {
      variant: "error",
    },
  },
);

const icons = {
  error: AlertErrorIcon,
  success: AlertSuccessIcon,
  warning: AlertWarningIcon,
  destructive: AlertErrorIcon,
};

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "error" | "success" | "warning" | "destructive";
  title?: string;
  description?: string;
};

const Alert = ({
  className,
  variant = "warning",
  title,
  description,
  children,
  ...props
}: AlertProps) => {
  const IconComponent = icons[variant];

  // If used in composition mode (with children), render differently
  if (children && !title && !description) {
    return (
      <div
        role="alert"
        className={cn(
          "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
          {
            "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200": variant === "success",
            "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200": variant === "warning",
            "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200": variant === "error" || variant === "destructive",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  // Original structured mode
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <IconComponent />

      <div className="w-full">
        {title && (
          <h5
            className={cn("mb-4 font-bold leading-[22px]", {
              "text-[#004434] dark:text-[#34D399]": variant === "success",
              "text-[#9D5425]": variant === "warning",
              "text-[#BC1C21]": variant === "error" || variant === "destructive",
            })}
          >
            {title}
          </h5>
        )}

        {description && (
          <div
            className={cn({
              "text-[#637381]": variant === "success",
              "text-[#D0915C]": variant === "warning",
              "text-[#CD5D5D]": variant === "error" || variant === "destructive",
            })}
          >
            {description}
          </div>
        )}
      </div>
    </div>
  );
};

// AlertTitle component for composition mode
const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

// AlertDescription component for more flexible alert content
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, type AlertProps };