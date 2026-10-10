// Assumptions: logs go to the platform's stdout/stderr (Vercel captures both).
// Callers pass only identifiers (order id, soul id, status codes). Never pass raw bodies, emails, or names.

type Fields = Record<string, string | number | boolean | null | undefined>;

function line(level: string, message: string, fields?: Fields): string {
  return JSON.stringify({ level, message, ...fields, at: new Date().toISOString() });
}

export const logger = {
  info(message: string, fields?: Fields): void {
    if (process.env.NODE_ENV === "test") return;
    console.info(line("info", message, fields));
  },
  warn(message: string, fields?: Fields): void {
    console.warn(line("warn", message, fields));
  },
  error(message: string, fields?: Fields): void {
    console.error(line("error", message, fields));
  },
};
