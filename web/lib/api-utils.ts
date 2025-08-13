import { NextResponse } from 'next/server'
import { z } from 'zod'

// Standard API response types
export interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
  meta?: Record<string, unknown>
}

// Standard error response format
export interface ApiError {
  error: string
  code?: string
  details?: string
  timestamp: string
}

// Common security headers for all API responses
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Type': 'application/json',
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  code?: string,
  details?: string
): NextResponse<ApiError> {
  const errorResponse: ApiError = {
    error,
    timestamp: new Date().toISOString(),
    ...(code && { code }),
    ...(details && { details }),
  }

  return NextResponse.json(errorResponse, { 
    status,
    headers: SECURITY_HEADERS
  })
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data?: T,
  meta?: Record<string, unknown>,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    ok: true,
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  }

  return NextResponse.json(response, { 
    status,
    headers: SECURITY_HEADERS
  })
}

/**
 * Validate request body with zod schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json()
    const validated = schema.parse(body)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ')
      return { success: false, error: `Validation failed: ${issues}` }
    }
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Invalid JSON in request body' }
    }
    return { success: false, error: 'Failed to parse request body' }
  }
}

/**
 * Validate query parameters with zod schema
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const params = Object.fromEntries(searchParams.entries())
    const validated = schema.parse(params)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ')
      return { success: false, error: `Query validation failed: ${issues}` }
    }
    return { success: false, error: 'Invalid query parameters' }
  }
}

/**
 * Create a fetch with timeout and abort signal
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options
  
  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

/**
 * Common zod schemas for reuse
 */
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
  
  // User email
  userEmail: z.string().email().optional(),
  
  // Recipe ID
  recipeId: z.string().min(1),
  
  // Servings
  servings: z.number().min(0.1).max(10).default(1),
  
  // Query string
  searchQuery: z.string().min(1).max(100),
}