declare module "sql.js" {
  export interface Database {
    run(sql: string, params?: any[]): void;
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export interface Statement {
    bind(params?: any[]): boolean;
    step(): boolean;
    get(): any[];
    getColumnNames(): string[];
    free(): void;
  }

  export default function initSqlJs(config?: any): Promise<SqlJsStatic>;

  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }
}
