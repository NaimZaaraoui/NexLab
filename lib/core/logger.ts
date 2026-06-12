import fs from 'fs';
import path from 'path';
import os from 'os';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'METRIC';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  path?: string;
  durationMs?: number;
}

// Assure that the logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Using a rolling datestamp so we don't have a giant single file
const getLogFilePath = () => {
  const date = new Date().toISOString().split('T')[0];
  return path.join(logDir, `server-${date}.log`);
};

class Logger {
  private formatMemoryUsage(data: number) {
    return `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
  }

  private writeLog(level: LogLevel, message: string, context?: Record<string, any>) {
    const memoryData = process.memoryUsage();
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        sys: {
          memRss: this.formatMemoryUsage(memoryData.rss),
          memHeapUsed: this.formatMemoryUsage(memoryData.heapUsed),
          cpuLoad: os.loadavg()[0].toFixed(2) // 1 min load average
        }
      }
    };

    // Console output for standard next.js logging
    console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'info'](
      `[${entry.timestamp}] ${level}: ${message}`
    );

    // Asynchronous file write to avoid blocking the event loop
    fs.appendFile(getLogFilePath(), JSON.stringify(entry) + '\n', (err) => {
      if (err) console.error('Failed to write to structured log file:', err);
    });
  }

  info(message: string, context?: Record<string, any>) {
    this.writeLog('INFO', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.writeLog('WARN', message, context);
  }

  error(message: string, error?: Error | any, context?: Record<string, any>) {
    const errorDetails = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : { rawError: error };
      
    this.writeLog('ERROR', message, { ...context, error: errorDetails });
  }

  metric(name: string, value: number, unit: string, context?: Record<string, any>) {
    this.writeLog('METRIC', `Metric: ${name}`, { value, unit, ...context });
  }

  // Returns the last N lines of the current day's log file
  async getRecentLogs(lines: number = 100): Promise<LogEntry[]> {
    try {
      const filePath = getLogFilePath();
      if (!fs.existsSync(filePath)) return [];
      
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      const logLines = fileContent.trim().split('\n');
      
      return logLines
        .slice(-lines)
        .map(line => {
          try {
            return JSON.parse(line) as LogEntry;
          } catch (e) {
            return null;
          }
        })
        .filter((entry): entry is LogEntry => entry !== null)
        .reverse(); // Latest first
    } catch (err) {
      console.error('Error reading logs:', err);
      return [];
    }
  }
}

export const logger = new Logger();
