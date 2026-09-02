import { env } from '../config/env.config';

export type LogCategory =
  | 'AUTH'
  | 'LISTING'
  | 'PAYMENT'
  | 'VERIFICATION'
  | 'NOTIFICATION'
  | 'SECURITY'
  | 'SYSTEM';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogPayload {
  category: LogCategory;
  message: string;
  data?: Record<string, unknown>;
  error?: Error | unknown;
}

const sanitizeData = (data?: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (!data) return undefined;
  const sensitiveKeys = ['password', 'token', 'refreshToken', 'secret', 'authorization', 'cookie'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '***MASQUÉ***';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

class Logger {
  private formatLog(level: LogLevel, payload: LogPayload): string {
    const timestamp = new Date().toISOString();
    const sanitized = sanitizeData(payload.data);
    const logObject: Record<string, unknown> = {
      timestamp,
      level,
      category: payload.category,
      message: payload.message,
    };

    if (sanitized && Object.keys(sanitized).length > 0) {
      logObject.data = sanitized;
    }

    if (payload.error instanceof Error) {
      logObject.error = {
        name: payload.error.name,
        message: payload.error.message,
        ...(env.NODE_ENV !== 'production' ? { stack: payload.error.stack } : {}),
      };
    }

    return JSON.stringify(logObject);
  }

  info(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    const formatted = this.formatLog('INFO', { category, message, data });
    console.log(formatted);
  }

  warn(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    const formatted = this.formatLog('WARN', { category, message, data });
    console.warn(formatted);
  }

  error(category: LogCategory, message: string, error?: unknown, data?: Record<string, unknown>): void {
    const formatted = this.formatLog('ERROR', { category, message, error, data });
    console.error(formatted);
  }

  debug(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    if (env.NODE_ENV === 'development') {
      const formatted = this.formatLog('DEBUG', { category, message, data });
      console.debug(formatted);
    }
  }
}

export const logger = new Logger();
