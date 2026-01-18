/**
 * Error handling utilities for API and application errors
 */

import type { ApiError } from "@/types/api"

/**
 * Standard error types
 */
export enum ErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}

/**
 * Application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = "AppError"
  }
}

/**
 * Parse API error response
 */
export function parseApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return new AppError("Network error. Please check your connection.", ErrorType.NETWORK)
    }

    // Try to parse as API error
    try {
      const apiError = JSON.parse(error.message) as ApiError
      return new AppError(
        apiError.message || apiError.error || "An error occurred",
        ErrorType.SERVER,
        apiError.code,
        apiError.details
      )
    } catch {
      // Not a JSON error, return as-is
      return new AppError(error.message, ErrorType.UNKNOWN)
    }
  }

  return new AppError("An unknown error occurred", ErrorType.UNKNOWN)
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: AppError | Error | unknown): string {
  const appError = error instanceof AppError ? error : parseApiError(error)

  switch (appError.type) {
    case ErrorType.NETWORK:
      return "Unable to connect to the server. Please check your internet connection and try again."
    case ErrorType.VALIDATION:
      return appError.message || "Please check your input and try again."
    case ErrorType.NOT_FOUND:
      return "The requested resource was not found."
    case ErrorType.UNAUTHORIZED:
      return "You are not authorized to perform this action. Please log in."
    case ErrorType.FORBIDDEN:
      return "You do not have permission to perform this action."
    case ErrorType.SERVER:
      return appError.message || "A server error occurred. Please try again later."
    default:
      return appError.message || "An unexpected error occurred. Please try again."
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: AppError | Error | unknown): boolean {
  const appError = error instanceof AppError ? error : parseApiError(error)
  return appError.type === ErrorType.NETWORK || appError.type === ErrorType.SERVER
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): Record<string, any> {
  if (error instanceof AppError) {
    return {
      name: error.name,
      message: error.message,
      type: error.type,
      code: error.code,
      details: error.details,
      stack: error.stack,
    }
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    error: String(error),
  }
}

