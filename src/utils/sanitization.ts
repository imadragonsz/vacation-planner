import DOMPurify from "dompurify";

/**
 * Sanitizes a string to prevent XSS attacks.
 * @param value The string to sanitize.
 * @returns The sanitized string.
 */
export const sanitize = (value: string): string => {
  if (!value) return "";
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [], // No HTML allowed for standard text fields
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitizes an object of values (e.g., form data).
 * @param data The object to sanitize.
 * @returns A new object with sanitized values.
 */
export const sanitizeObject = <T extends Record<string, any>>(data: T): T => {
  const sanitized = { ...data };
  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      (sanitized as any)[key] = sanitize(sanitized[key]);
    }
  }
  return sanitized;
};
