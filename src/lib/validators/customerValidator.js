/**
 * Customer Validator
 * Validates customer data before sending to Paystack API
 */

import { z } from 'zod';

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{10,14}$/, 'Invalid phone number (e.g. +2348123456789)');

const phoneField = z.union([z.literal(''), phoneSchema]).optional();

export const customerCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().trim().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().trim().min(1, 'Last name is required').max(50, 'Last name is too long'),
  phone: phoneField,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const customerUpdateSchema = z
  .object({
    email: z.string().email('Invalid email address').optional(),
    firstName: z.string().trim().min(1, 'First name is required').max(50, 'First name is too long').optional(),
    lastName: z.string().trim().min(1, 'Last name is required').max(50, 'Last name is too long').optional(),
    phone: phoneField,
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (data) =>
      data.firstName !== undefined ||
      data.lastName !== undefined ||
      data.phone !== undefined ||
      data.metadata !== undefined,
    { message: 'At least one field is required to update' }
  );

export const customerFiltersSchema = z.object({
  perPage: z.number().min(1).max(100).optional(),
  page: z.number().min(1).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
});

export function validateCustomerCreate(data) {
  try {
    return {
      success: true,
      data: customerCreateSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      errors: error.issues || [],
    };
  }
}

export function validateCustomerUpdate(data) {
  try {
    return {
      success: true,
      data: customerUpdateSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      errors: error.issues || [],
    };
  }
}

export function validateCustomerFilters(data) {
  try {
    return {
      success: true,
      data: customerFiltersSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      errors: error.issues || [],
    };
  }
}

export function formatValidationErrors(errors) {
  return errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
