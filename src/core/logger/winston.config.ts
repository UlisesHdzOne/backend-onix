import winston from 'winston';
import 'winston-daily-rotate-file';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isDevelopment = nodeEnv === 'development';

const logLevel = process.env.LOG_LEVEL ?? (isDevelopment ? 'debug' : 'info');

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, ...metadata }) => {
    let metaString = '';

    const meta = { context, ...metadata };
    const filtered = Object.fromEntries(
      Object.entries(meta).filter(([_, v]) => v !== undefined && v !== null),
    );

    if (Object.keys(filtered).length > 0) {
      metaString = ` ${JSON.stringify(filtered)}`;
    }

    return `[${timestamp as string}] ${level}: ${message as string}${metaString}`;
  }),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const winstonLogger = winston.createLogger({
  level: logLevel,
  format: fileFormat,
  transports: [
    new winston.transports.Console({ format: consoleFormat }),

    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
    }),

    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    }),
  ],
});

export class AppLogger {
  constructor(private readonly context: string) {}

  log(message: string, metadata?: Record<string, unknown>): void {
    winstonLogger.info(message, { context: this.context, ...metadata });
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    winstonLogger.error(message, {
      context: this.context,
      error: error?.message,
      stack: error?.stack,
      ...metadata,
    });
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    winstonLogger.warn(message, { context: this.context, ...metadata });
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    winstonLogger.debug(message, { context: this.context, ...metadata });
  }
}

export const logger = new AppLogger('Global');
