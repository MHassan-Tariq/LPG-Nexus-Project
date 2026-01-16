"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (in production, send to error tracking service)
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // TODO: Send to error tracking service (e.g., Sentry)
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="mx-auto mt-8 max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Something went wrong</CardTitle>
            </div>
            <CardDescription className="text-red-700">
              An unexpected error occurred. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="rounded-md bg-red-100 p-3 text-sm text-red-800">
                <p className="font-semibold">Error Details (Development Only):</p>
                <p className="mt-1 font-mono text-xs">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">Stack Trace</summary>
                    <pre className="mt-2 overflow-auto text-xs">{this.state.error.stack}</pre>
                  </details>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline" className="flex-1">
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                className="flex-1"
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based Error Boundary (Alternative approach)
 * Note: React doesn't support hooks for error boundaries yet,
 * but this can be used for error handling in functional components
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: Record<string, unknown>) => {
    console.error("Error caught by error handler:", error, errorInfo);
    // TODO: Send to error tracking service
    throw error; // Re-throw to be caught by nearest ErrorBoundary
  };
}

