/**
 * @file logger.ts
 * Logger estruturado com ring-buffer em memória para visualização no dashboard.
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';

export interface LogEntry {
  id: string;
  timestamp: string;
  epochMs: number;
  level: LogLevel;
  source: string;
  message: string;
  meta?: Record<string, unknown>;
}

class SystemLogger {
  private buffer: LogEntry[] = [];
  private readonly maxBufferSize = 250;
  private counter = 0;

  private createEntry(level: LogLevel, source: string, message: string, meta?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${++this.counter}`,
      timestamp: new Date().toISOString(),
      epochMs: Date.now(),
      level,
      source,
      message: this.sanitize(message),
      meta: meta ? this.sanitizeMeta(meta) : undefined,
    };

    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    // Saída estruturada segura no console do servidor
    const consolePrefix = `[${entry.timestamp}] [${level}] [${source}]:`;
    if (level === 'ERROR') {
      console.error(consolePrefix, entry.message);
    } else if (level === 'WARN') {
      console.warn(consolePrefix, entry.message);
    } else {
      console.log(consolePrefix, entry.message);
    }

    return entry;
  }

  private sanitize(text: string): string {
    // Sanitiza potenciais credenciais ou dumps brutos de pacotes
    return text.replace(/[<>]/g, '').trim();
  }

  private sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
    const safe: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(meta)) {
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        safe[key] = val;
      } else if (val && typeof val === 'object') {
        try {
          safe[key] = JSON.parse(JSON.stringify(val));
        } catch {
          safe[key] = '[Complex Object]';
        }
      }
    }
    return safe;
  }

  public info(source: string, message: string, meta?: Record<string, unknown>): LogEntry {
    return this.createEntry('INFO', source, message, meta);
  }

  public warn(source: string, message: string, meta?: Record<string, unknown>): LogEntry {
    return this.createEntry('WARN', source, message, meta);
  }

  public error(source: string, message: string, meta?: Record<string, unknown>): LogEntry {
    return this.createEntry('ERROR', source, message, meta);
  }

  public security(source: string, message: string, meta?: Record<string, unknown>): LogEntry {
    return this.createEntry('SECURITY', source, message, meta);
  }

  public getRecentLogs(limit = 100, level?: LogLevel): LogEntry[] {
    let result = [...this.buffer];
    if (level) {
      result = result.filter((entry) => entry.level === level);
    }
    return result.slice(-Math.min(limit, this.maxBufferSize));
  }

  public clear(): void {
    this.buffer = [];
    this.info('SystemLogger', 'Buffer de logs limpo pelo operador.');
  }
}

export const logger = new SystemLogger();
