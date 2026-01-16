/**
 * Centralized Logging Utility
 * 
 * Provides structured logging with different log levels.
 * In production, this can be extended to send logs to external services.
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  /**
   * Log debug messages (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || "");
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || "");
    }
    // In production, send to logging service
    // this.sendToService(LogLevel.INFO, message, context);
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context || "");
    // In production, send to logging service
    // this.sendToService(LogLevel.WARN, message, context);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error 
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : error;

    console.error(`[ERROR] ${message}`, {
      error: errorDetails,
      ...context,
    });

    // In production, send to error tracking service (e.g., Sentry)
    // if (this.isProduction && error instanceof Error) {
    //   Sentry.captureException(error, { extra: context });
    // }
  }

  /**
   * Log API request/response
   */
  api(method: string, url: string, status: number, duration?: number, context?: LogContext): void {
    const message = `${method} ${url} - ${status}${duration ? ` (${duration}ms)` : ""}`;
    
    if (status >= 500) {
      this.error(message, undefined, context);
    } else if (status >= 400) {
      this.warn(message, context);
    } else {
      this.info(message, context);
    }
  }

  /**
   * Log database query
   */
  db(operation: string, model: string, duration?: number, context?: LogContext): void {
    const message = `DB ${operation} ${model}${duration ? ` (${duration}ms)` : ""}`;
    this.debug(message, context);
  }

  /**
   * Send logs to external service (to be implemented)
   */
  private sendToService(level: LogLevel, message: string, context?: LogContext): void {
    // TODO: Implement integration with logging service
    // Examples: Sentry, LogRocket, Datadog, etc.
    if (this.isProduction) {
      // Example:
      // fetch('/api/logs', {
      //   method: 'POST',
      //   body: JSON.stringify({ level, message, context, timestamp: new Date().toISOString() })
      // });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error | unknown, context?: LogContext) => logger.error(message, error, context),
  api: (method: string, url: string, status: number, duration?: number, context?: LogContext) => 
    logger.api(method, url, status, duration, context),
  db: (operation: string, model: string, duration?: number, context?: LogContext) => 
    logger.db(operation, model, duration, context),
};

