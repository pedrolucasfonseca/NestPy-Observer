import fs from 'fs';
import path from 'path';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

// help function to write logs as json lines
export function writeLog(level: LogLevel, message: string, logPath?: string) {
    const targetPath = logPath ?? process.env['LOG_PATH'] ?? '/app/logs/app.log';
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message
    };
    // Serialize the object as a single json line
    const logLine = JSON.stringify(logEntry) + '\n';

    // ensures the target directory exists (e.g. when logPath is a temp dir in tests)
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    // Append to the log file
    fs.appendFileSync(targetPath, logLine);
}
