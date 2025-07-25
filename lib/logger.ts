/**
 * Production-ready logging system
 * Replaces console.log statements with structured logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  userId?: string;
  requestId?: string;
  component?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      component: this.getCallerInfo(),
    };
  }

  private getCallerInfo(): string {
    if (this.isClient) {
      const stack = new Error().stack;
      const caller = stack?.split('\n')[3];
      return caller?.trim().split(' ')[1] || 'unknown';
    }
    return 'server';
  }

  private log(level: LogLevel, message: string, data?: any) {
    const logEntry = this.formatMessage(level, message, data);

    // Always log errors and warnings
    if (level === 'error' || level === 'warn') {
      console[level](`[${level.toUpperCase()}] ${message}`, data || '');
      
      // In production, send to external logging service
      if (!this.isDevelopment) {
        this.sendToExternalService(logEntry);
      }
      return;
    }

    // Log info and debug only in development
    if (this.isDevelopment) {
      console.info(`[${level.toUpperCase()}] ${message}`, data || '');
    }

    // In production, send only important info logs to external service
    if (!this.isDevelopment && level === 'info') {
      this.sendToExternalService(logEntry);
    }
  }

  private sendToExternalService(logEntry: LogEntry) {
    // TODO: Implement external logging service integration
    // Examples: Sentry, LogRocket, DataDog, etc.
    
    // For now, we'll store critical logs in a queue for batch sending
    if (this.isClient) {
      this.queueClientLog(logEntry);
    }
  }

  private queueClientLog(logEntry: LogEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(logEntry);
      
      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }

  // Public logging methods
  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: any) {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error;
    
    this.log('error', message, errorData);
  }

  // Specialized logging methods
  api(method: string, endpoint: string, status: number, duration?: number, data?: any) {
    const message = `${method} ${endpoint} - ${status}`;
    const logData = {
      method,
      endpoint,
      status,
      duration,
      ...data,
    };

    if (status >= 400) {
      this.error(message, logData);
    } else {
      this.info(message, logData);
    }
  }

  payment(action: string, data: any) {
    this.info(`Payment: ${action}`, {
      action,
      ...data,
      // Remove sensitive data
      cardNumber: data.cardNumber ? '****' + data.cardNumber.slice(-4) : undefined,
    });
  }

  auth(action: string, userId?: string, data?: any) {
    this.info(`Auth: ${action}`, {
      action,
      userId,
      ...data,
    });
  }

  booking(action: string, bookingId: string, data?: any) {
    this.info(`Booking: ${action}`, {
      action,
      bookingId,
      ...data,
    });
  }

  admin(action: string, adminId: string, data?: any) {
    this.info(`Admin: ${action}`, {
      action,
      adminId,
      ...data,
    });
  }

  // Performance logging
  performance(operation: string, duration: number, data?: any) {
    const message = `Performance: ${operation} took ${duration}ms`;
    
    if (duration > 1000) {
      this.warn(message, { operation, duration, ...data });
    } else {
      this.debug(message, { operation, duration, ...data });
    }
  }

  // Get logs for debugging (development only)
  getLogs(): LogEntry[] {
    if (!this.isDevelopment || !this.isClient) {
      return [];
    }

    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Clear logs
  clearLogs() {
    if (this.isClient) {
      localStorage.removeItem('app_logs');
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for common use cases
export const logError = (message: string, error?: any) => logger.error(message, error);
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logWarning = (message: string, data?: any) => logger.warn(message, data);
export const logDebug = (message: string, data?: any) => logger.debug(message, data);

// Performance measurement utility
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T> | T,
  data?: any
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.performance(operation, duration, data);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Performance: ${operation} failed after ${duration}ms`, error);
    throw error;
  }
};

// API logging utility
export const logApiCall = (
  method: string,
  endpoint: string,
  status: number,
  duration?: number,
  data?: any
) => {
  logger.api(method, endpoint, status, duration, data);
};

export default logger;