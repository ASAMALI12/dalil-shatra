/**
 * Iraqi Phone Number Normalization, Validation, and Anti-Fraud Utilities
 * Strictly enforces real business phone numbers and rejects placeholder/dummy numbers.
 */

// Mapping Eastern Arabic numerals to standard Western numerals
const ARABIC_NUMERALS_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

/**
 * Normalizes any telephone string into clean ASCII digits with Iraqi prefix standards
 */
export function normalizeIraqPhone(rawPhone: string | undefined | null): string {
  if (!rawPhone) return '';

  // 1. Convert Arabic/Persian numerals
  let cleaned = rawPhone.toString().replace(/[٠-٩۰-۹]/g, (d) => ARABIC_NUMERALS_MAP[d] || d);

  // 2. Remove all non-digit characters
  cleaned = cleaned.replace(/[^0-9]/g, '');

  // 3. Handle international prefixes (00964 or 964)
  if (cleaned.startsWith('00964')) {
    cleaned = '0' + cleaned.slice(5);
  } else if (cleaned.startsWith('964')) {
    cleaned = '0' + cleaned.slice(3);
  }

  // 4. If someone entered 7XXXXXXXXX without leading zero, prepend 0
  if (cleaned.length === 10 && cleaned.startsWith('7')) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

/**
 * Checks if a phone number is an obvious placeholder, fake, or dummy number.
 * E.g., 07800000000, 07777777777, 07801234567, 12345678, etc.
 */
export function isFakeOrPlaceholderPhone(phone: string): boolean {
  const clean = normalizeIraqPhone(phone);
  if (!clean || clean.length < 8) return true;

  // Pattern 1: Same digit repeating multiple times (e.g. 000000, 111111)
  if (/(.)\1{5,}/.test(clean)) return true;

  // Pattern 2: Known fake test numbers specifically noted by user
  const knownFakes = [
    '07800000000',
    '07700000000',
    '07500000000',
    '07900000000',
    '07777777777',
    '07888888888',
    '07555555555',
    '07801234567',
    '07701234567',
    '07501234567',
    '07712345678',
    '07812345678',
    '01234567890',
    '12345678901',
    '00000000000',
  ];
  if (knownFakes.includes(clean)) return true;

  // Pattern 3: Sequential ascending/descending digits
  const sequentialPatterns = ['012345', '123456', '234567', '345678', '456789', '987654', '876543'];
  for (const seq of sequentialPatterns) {
    if (clean.includes(seq)) return true;
  }

  // Pattern 4: Alternating repetitive sequences e.g. 12121212
  if (/(..)\1{3,}/.test(clean)) return true;

  return false;
}

export interface IraqPhoneValidationResult {
  isValid: boolean;
  normalized: string;
  type: 'mobile' | 'landline' | 'shortcode' | 'unknown';
  carrier?: 'Zain' | 'AsiaCell' | 'Korek' | 'Other';
  formattedDisplay: string;
  reason?: string;
}

/**
 * Full validation and carrier identification for Iraqi phone numbers
 */
export function validateIraqPhone(rawPhone: string | undefined | null): IraqPhoneValidationResult {
  if (!rawPhone || !rawPhone.toString().trim()) {
    return {
      isValid: false,
      normalized: '',
      type: 'unknown',
      formattedDisplay: '',
      reason: 'رقم الهاتف مفقود أو فارغ',
    };
  }

  const normalized = normalizeIraqPhone(rawPhone);

  if (normalized.length < 8) {
    return {
      isValid: false,
      normalized,
      type: 'unknown',
      formattedDisplay: rawPhone,
      reason: 'رقم الهاتف ناقص أو غير مكتمل (أقل من 8 أرقام)',
    };
  }

  if (isFakeOrPlaceholderPhone(normalized)) {
    return {
      isValid: false,
      normalized,
      type: 'unknown',
      formattedDisplay: rawPhone,
      reason: 'رقم هاتف وهمي أو غير صالح للاستخدام (أرقام مكررة أو افتراضية)',
    };
  }

  // Check Iraqi mobile patterns: 11 digits starting with 07X
  if (normalized.length === 11 && normalized.startsWith('07')) {
    const prefix = normalized.slice(0, 4);
    let carrier: 'Zain' | 'AsiaCell' | 'Korek' | 'Other' = 'Other';

    // Zain: 0780-0789, 0790
    if (/^078[0-9]/.test(prefix) || prefix === '0790') {
      carrier = 'Zain';
    }
    // AsiaCell: 0770-0779
    else if (/^077[0-9]/.test(prefix)) {
      carrier = 'AsiaCell';
    }
    // Korek: 0750-0754
    else if (/^075[0-4]/.test(prefix)) {
      carrier = 'Korek';
    }

    const formattedDisplay = `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;

    return {
      isValid: true,
      normalized,
      type: 'mobile',
      carrier,
      formattedDisplay,
    };
  }

  // Check Iraqi landline: Baghdad (01 + 7 digits) or Provinces (03X/04X/05X + 6/7 digits)
  if (/^0[1-5][0-9]{6,8}$/.test(normalized)) {
    return {
      isValid: true,
      normalized,
      type: 'landline',
      formattedDisplay: normalized,
    };
  }

  // Emergency or verified shortcodes (e.g. 104, 115, 122, 4-digit hotlines)
  if (/^[0-9]{3,5}$/.test(normalized)) {
    return {
      isValid: true,
      normalized,
      type: 'shortcode',
      formattedDisplay: normalized,
    };
  }

  // Any other number with 8-11 digits that didn't match strict mobile prefix but is valid digits
  if (normalized.length >= 8 && normalized.length <= 11) {
    return {
      isValid: true,
      normalized,
      type: 'unknown',
      formattedDisplay: normalized,
    };
  }

  return {
    isValid: false,
    normalized,
    type: 'unknown',
    formattedDisplay: rawPhone,
    reason: 'صيغة رقم الهاتف لا تطابق شبكات الاتصال في العراق',
  };
}
