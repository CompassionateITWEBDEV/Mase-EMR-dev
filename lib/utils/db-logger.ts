/**
 * Comprehensive Database Connection and Operation Logger
 * Provides detailed verbose logging for all database operations
 */

interface LogContext {
  operation: string;
  table: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

interface ConnectionInfo {
  url: string;
  clientType: "browser" | "server" | "service-role";
  timestamp: string;
  connectionId: string;
}

interface QueryInfo {
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "UPSERT";
  table: string;
  filters?: Record<string, any>;
  data?: Record<string, any>;
  queryString?: string;
}

interface PerformanceMetrics {
  connectionTime?: number;
  queryTime?: number;
  totalTime?: number;
  rowsAffected?: number;
  rowsReturned?: number;
}

class DatabaseLogger {
  private static instance: DatabaseLogger;
  private logLevel: "verbose" | "normal" | "minimal" = "verbose";
  private connectionCounter = 0;
  private requestCounter = 0;

  private constructor() {
    // Initialize logger
    this.logLevel = (process.env.DB_LOG_LEVEL as any) || "verbose";
  }

  static getInstance(): DatabaseLogger {
    if (!DatabaseLogger.instance) {
      DatabaseLogger.instance = new DatabaseLogger();
    }
    return DatabaseLogger.instance;
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    this.connectionCounter++;
    return `conn-${Date.now()}-${this.connectionCounter}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    this.requestCounter++;
    return `req-${Date.now()}-${this.requestCounter}`;
  }

  /**
   * Format log message with timestamp and context
   */
  private formatLog(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context, null, 2)}` : "";
    return `[${timestamp}] [DB-${level}] ${message}${contextStr}`;
  }

  /**
   * Log database connection establishment
   */
  logConnectionStart(
    clientType: "browser" | "server" | "service-role",
    url: string,
    context?: LogContext
  ): ConnectionInfo {
    const connectionId = this.generateConnectionId();
    const connectionInfo: ConnectionInfo = {
      url: url.replace(/\/\/.*@/, "//***:***@"), // Mask credentials
      clientType,
      timestamp: new Date().toISOString(),
      connectionId,
    };

    console.log(
      this.formatLog("INFO", `🔌 Database Connection Initiated`, {
        connectionId,
        clientType,
        url: connectionInfo.url,
        operation: context?.operation || "unknown",
        table: context?.table || "unknown",
        ...context,
      })
    );

    return connectionInfo;
  }

  /**
   * Log successful connection establishment
   */
  logConnectionSuccess(connectionInfo: ConnectionInfo, duration: number, context?: LogContext): void {
    console.log(
      this.formatLog("INFO", `✅ Database Connection Established`, {
        connectionId: connectionInfo.connectionId,
        clientType: connectionInfo.clientType,
        duration: `${duration.toFixed(2)}ms`,
        timestamp: connectionInfo.timestamp,
        operation: context?.operation || "unknown",
        table: context?.table || "unknown",
        ...context,
      })
    );
  }

  /**
   * Log connection failure
   */
  logConnectionError(
    connectionInfo: ConnectionInfo,
    error: Error | any,
    duration: number,
    context?: LogContext
  ): void {
    console.error(
      this.formatLog("ERROR", `❌ Database Connection Failed`, {
        connectionId: connectionInfo.connectionId,
        clientType: connectionInfo.clientType,
        duration: `${duration.toFixed(2)}ms`,
        error: {
          message: error?.message || "Unknown error",
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          stack: this.logLevel === "verbose" ? error?.stack : undefined,
        },
        operation: context?.operation || "unknown",
        table: context?.table || "unknown",
        ...context,
      })
    );
  }

  /**
   * Log query start
   */
  logQueryStart(queryInfo: QueryInfo, connectionId: string, context?: LogContext): string {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    console.log(
      this.formatLog("DEBUG", `📤 Query Execution Started`, {
        requestId,
        connectionId,
        operation: queryInfo.operation,
        table: queryInfo.table,
        filters: queryInfo.filters,
        dataPreview: queryInfo.data
          ? Object.keys(queryInfo.data).reduce((acc, key) => {
              const value = queryInfo.data![key];
              acc[key] =
                typeof value === "string" && value.length > 50
                  ? `${value.substring(0, 50)}...`
                  : value;
              return acc;
            }, {} as Record<string, any>)
          : undefined,
        queryString: queryInfo.queryString,
        timestamp: new Date().toISOString(),
        ...context,
      })
    );

    // Store start time for performance tracking
    (global as any).__dbQueryTimes = (global as any).__dbQueryTimes || {};
    (global as any).__dbQueryTimes[requestId] = startTime;

    return requestId;
  }

  /**
   * Log query success
   */
  logQuerySuccess(
    requestId: string,
    queryInfo: QueryInfo,
    connectionId: string,
    metrics: PerformanceMetrics,
    result?: any,
    context?: LogContext
  ): void {
    const startTime = (global as any).__dbQueryTimes?.[requestId];
    const queryTime = startTime ? Date.now() - startTime : metrics.queryTime || 0;

    console.log(
      this.formatLog("INFO", `✅ Query Execution Successful`, {
        requestId,
        connectionId,
        operation: queryInfo.operation,
        table: queryInfo.table,
        queryTime: `${queryTime.toFixed(2)}ms`,
        rowsAffected: metrics.rowsAffected,
        rowsReturned: metrics.rowsReturned || (Array.isArray(result) ? result.length : result ? 1 : 0),
        resultPreview:
          this.logLevel === "verbose" && result
            ? Array.isArray(result)
              ? `Array[${result.length}] items`
              : typeof result === "object"
                ? Object.keys(result).slice(0, 5).reduce((acc, key) => {
                    acc[key] = result[key];
                    return acc;
                  }, {} as Record<string, any>)
                : result
            : undefined,
        timestamp: new Date().toISOString(),
        ...context,
      })
    );

    // Clean up
    if ((global as any).__dbQueryTimes?.[requestId]) {
      delete (global as any).__dbQueryTimes[requestId];
    }
  }

  /**
   * Log query error
   */
  logQueryError(
    requestId: string,
    queryInfo: QueryInfo,
    connectionId: string,
    error: Error | any,
    metrics: PerformanceMetrics,
    context?: LogContext
  ): void {
    const startTime = (global as any).__dbQueryTimes?.[requestId];
    const queryTime = startTime ? Date.now() - startTime : metrics.queryTime || 0;

    console.error(
      this.formatLog("ERROR", `❌ Query Execution Failed`, {
        requestId,
        connectionId,
        operation: queryInfo.operation,
        table: queryInfo.table,
        queryTime: `${queryTime.toFixed(2)}ms`,
        error: {
          message: error?.message || "Unknown error",
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          statusCode: error?.statusCode,
          stack: this.logLevel === "verbose" ? error?.stack : undefined,
        },
        queryInfo: {
          filters: queryInfo.filters,
          dataPreview: queryInfo.data
            ? Object.keys(queryInfo.data).slice(0, 3).reduce((acc, key) => {
                acc[key] = queryInfo.data![key];
                return acc;
              }, {} as Record<string, any>)
            : undefined,
        },
        timestamp: new Date().toISOString(),
        ...context,
      })
    );

    // Clean up
    if ((global as any).__dbQueryTimes?.[requestId]) {
      delete (global as any).__dbQueryTimes[requestId];
    }
  }

  /**
   * Log CRUD operation summary
   */
  logOperationSummary(
    operation: "CREATE" | "READ" | "UPDATE" | "DELETE",
    table: string,
    success: boolean,
    metrics: PerformanceMetrics,
    context?: LogContext
  ): void {
    const emoji = success ? "✅" : "❌";
    const status = success ? "SUCCESS" : "FAILED";

    console.log(
      this.formatLog(success ? "INFO" : "ERROR", `${emoji} ${operation} Operation ${status}`, {
        operation,
        table,
        totalTime: metrics.totalTime ? `${metrics.totalTime.toFixed(2)}ms` : undefined,
        connectionTime: metrics.connectionTime ? `${metrics.connectionTime.toFixed(2)}ms` : undefined,
        queryTime: metrics.queryTime ? `${metrics.queryTime.toFixed(2)}ms` : undefined,
        rowsAffected: metrics.rowsAffected,
        rowsReturned: metrics.rowsReturned,
        timestamp: new Date().toISOString(),
        ...context,
      })
    );
  }

  /**
   * Log data transformation
   */
  logDataTransformation(
    stage: "before" | "after",
    operation: string,
    data: any,
    context?: LogContext
  ): void {
    if (this.logLevel !== "verbose") return;

    console.log(
      this.formatLog("DEBUG", `🔄 Data Transformation: ${stage.toUpperCase()}`, {
        stage,
        operation,
        dataPreview:
          typeof data === "object"
            ? Object.keys(data).slice(0, 10).reduce((acc, key) => {
                const value = data[key];
                acc[key] =
                  typeof value === "string" && value.length > 100
                    ? `${value.substring(0, 100)}...`
                    : value;
                return acc;
              }, {} as Record<string, any>)
            : data,
        ...context,
      })
    );
  }
}

// Export singleton instance
export const dbLogger = DatabaseLogger.getInstance();

// Export types for use in other modules
export type { LogContext, ConnectionInfo, QueryInfo, PerformanceMetrics };

