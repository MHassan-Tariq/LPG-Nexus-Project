"use client";

import { ReactNode } from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface FormFieldWrapperProps {
  control: any;
  name: string;
  label?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
  showError?: boolean;
}

/**
 * Enhanced Form Field Wrapper
 * 
 * Provides consistent form field styling with real-time validation feedback.
 */
export function FormFieldWrapper({
  control,
  name,
  label,
  description,
  children,
  className,
  required = false,
  showError = true,
}: FormFieldWrapperProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = fieldState.error !== undefined;
        const isTouched = fieldState.isTouched;
        const showValidation = isTouched && hasError;

        return (
          <FormItem className={cn("space-y-2", className)}>
            {label && (
              <FormLabel className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
                {label}
              </FormLabel>
            )}
            <FormControl>
              <div
                className={cn(
                  "transition-all",
                  showValidation && "ring-2 ring-red-200 rounded-md",
                  !showValidation && isTouched && "ring-2 ring-green-200 rounded-md"
                )}
              >
                {children}
              </div>
            </FormControl>
            {description && !showValidation && (
              <FormDescription className="text-xs text-muted-foreground">
                {description}
              </FormDescription>
            )}
            {showError && showValidation && (
              <FormMessage className="text-xs text-red-600 font-medium" />
            )}
            {!showValidation && isTouched && !hasError && (
              <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Looks good!
              </div>
            )}
          </FormItem>
        );
      }}
    />
  );
}

