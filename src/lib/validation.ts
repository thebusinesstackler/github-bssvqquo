import { z } from 'zod';

// Card validation schemas
export const cardValidation = {
  cardholderName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens and apostrophes'),

  cardNumber: z
    .string()
    .min(13, 'Card number is too short')
    .max(19, 'Card number is too long')
    .regex(/^[0-9]+$/, 'Card number must contain only digits')
    .refine((num) => luhnCheck(num), 'Invalid card number'),

  expiryDate: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Expiry date must be in MM/YY format')
    .refine((date) => {
      const [month, year] = date.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      const now = new Date();
      return expiry > now;
    }, 'Card has expired'),

  cvc: z
    .string()
    .regex(/^[0-9]{3,4}$/, 'CVC must be 3 or 4 digits')
};

// Luhn algorithm check for card number validation
function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;

  // Loop through values starting from the rightmost digit
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i));

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Format card number with spaces
export function formatCardNumber(value: string): string {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(' ');
  }
  return value;
}

// Format expiry date
export function formatExpiryDate(value: string): string {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) {
    return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
  }
  return v;
}

// Get card type based on number
export function getCardType(cardNumber: string): string {
  const number = cardNumber.replace(/\s+/g, '');
  
  // Card type regex patterns
  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(number)) {
      return type;
    }
  }
  
  return 'unknown';
}

// Validate all card details
export function validateCardDetails(details: {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  try {
    cardValidation.cardholderName.parse(details.cardholderName);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.cardholderName = error.errors[0].message;
    }
  }

  try {
    cardValidation.cardNumber.parse(details.cardNumber.replace(/\s+/g, ''));
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.cardNumber = error.errors[0].message;
    }
  }

  try {
    cardValidation.expiryDate.parse(details.expiryDate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.expiryDate = error.errors[0].message;
    }
  }

  try {
    cardValidation.cvc.parse(details.cvc);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.cvc = error.errors[0].message;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}