/**
 * Input sanitization for security
 * Prevents XSS, injection, and prompt injection attacks
 */

export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return ''

  return input
    .trim()
    .slice(0, maxLength)
    // Remove potentially dangerous HTML/JavaScript
    .replace(/[<>{}]/g, '')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
}

/**
 * Sanitize input for AI prompts (more lenient but still safe)
 * Removes only control characters and limits length
 */
export function sanitizeForPrompt(input: string, maxLength: number = 2000): string {
  if (typeof input !== 'string') return ''

  return input
    .trim()
    .slice(0, maxLength)
    // Remove control characters but allow punctuation/special chars for natural language
    .replace(/[\x00-\x1F\x7F]/g, '')
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate phone number (basic)
 */
export function validatePhone(phone: string): boolean {
  // Allow 7-20 digits with optional +, spaces, dashes
  const phoneRegex = /^[\d\s\-+()]{7,20}$/
  return phoneRegex.test(phone)
}

/**
 * Sanitize slug (convert to valid slug format)
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric except dash
    .replace(/[\s_]+/g, '-') // Replace spaces/underscores with dash
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .slice(0, 100)
}

/**
 * Sanitize HTML entities to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return input.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char)
}

/**
 * Validate and sanitize business name for AI prompts
 */
export function sanitizeBusinessName(name: string): string {
  return sanitizeInput(name, 200)
}

/**
 * Validate and sanitize product name
 */
export function sanitizeProductName(name: string): string {
  return sanitizeInput(name, 200)
}

/**
 * Validate price is a valid number
 */
export function validatePrice(price: unknown): boolean {
  if (typeof price !== 'number') return false
  return price > 0 && Number.isFinite(price)
}

/**
 * Validate quantity is a positive integer
 */
export function validateQuantity(qty: unknown): boolean {
  if (typeof qty !== 'number') return false
  return Number.isInteger(qty) && qty > 0 && qty <= 10000
}

/**
 * Detect and prevent common injection patterns
 */
export function detectInjectionAttempt(input: string): boolean {
  const injectionPatterns = [
    // SQL Injection patterns
    /['"]?\s*(?:or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i, // OR/AND with number comparisons
    /['"]?\s*(?:or|and)\s+['"]?\w+['"]?\s*=\s*['"]?\w+/i, // OR/AND with string comparisons
    /--\s*$/, // SQL comments
    /;?\s*(?:drop|delete|insert|update|create)\s+/i, // SQL keywords
    /union\s+select/i, // UNION SELECT

    // XSS patterns
    /<\s*script/i, // Script tags
    /on\w+\s*=/i, // Event handlers (onclick, onload, etc.)
    /<\s*iframe/i, // iframes
    /javascript:/i, // Javascript protocol
    /<\s*(?:svg|img)\s+[^>]*on\w+/i, // SVG/IMG with event handlers

    // Prompt injection patterns
    /\b(?:ignore|forget|disregard)\s+(?:all|my|your|the)\s+(?:previous|prior)/i,
    /\binstructions?\b.*[\n;]/i,
  ]

  return injectionPatterns.some((pattern) => pattern.test(input))
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Check if string is safe (no suspicious patterns)
 */
export function isSafeInput(input: string): boolean {
  if (!input || typeof input !== 'string') return false
  if (input.length > 10000) return false
  if (detectInjectionAttempt(input)) return false
  return true
}
