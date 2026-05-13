declare module 'better-sqlite3' {
  type RunResult = {
    changes: number;
    lastInsertRowid: number | bigint;
  };

  interface Statement<BindParameters extends unknown[] = unknown[]> {
    run(...params: BindParameters): RunResult;
    get<T = unknown>(...params: BindParameters): T;
    all<T = unknown>(...params: BindParameters): T[];
  }

  interface Database {
    pragma(source: string): unknown;
    prepare<BindParameters extends unknown[] = unknown[]>(source: string): Statement<BindParameters>;
    exec(source: string): this;
    backup(destination: string): Promise<void>;
    transaction<T extends (...args: never[]) => unknown>(fn: T): T;
    close(): void;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: Record<string, unknown>): Database;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
