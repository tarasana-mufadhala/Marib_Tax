export interface ContactInfo {
  whatsapp: string;
  phone: string;
  address: string;
  hours: string;
  notes?: string;
}

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  whatsapp: '+967 777 000 111',
  phone: '06-302155 / 06-302156',
  address: 'محافظة مأرب — مأرب المدينة — الشارع العام — المجمع الحكومي لمكاتب الوزارات والهيئات الحكومية',
  hours: 'الأحد إلى الخميس — من 8:00 صباحاً حتى 2:00 ظهراً',
  notes: '',
};

export function parseContactInfo(body?: string | null): ContactInfo {
  if (!body?.trim()) return DEFAULT_CONTACT_INFO;
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        whatsapp: parsed.whatsapp?.trim() || DEFAULT_CONTACT_INFO.whatsapp,
        phone: parsed.phone?.trim() || DEFAULT_CONTACT_INFO.phone,
        address: parsed.address?.trim() || DEFAULT_CONTACT_INFO.address,
        hours: parsed.hours?.trim() || DEFAULT_CONTACT_INFO.hours,
        notes: parsed.notes?.trim() || '',
      };
    }
  } catch {
    // If legacy plain text was saved in body
    return { ...DEFAULT_CONTACT_INFO, notes: body };
  }
  return DEFAULT_CONTACT_INFO;
}

/**
 * Builds a valid WhatsApp chat URL for any given phone string.
 * Converts local or international numbers (e.g., '+967 777 000 111', '777123456', '0777123456')
 * into standard https://wa.me/<digits>
 */
export function getWhatsAppLink(phone: string): string {
  if (!phone) return 'https://wa.me/967777000111';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (digits.length === 9 && digits.startsWith('7')) {
    digits = '967' + digits;
  } else if (digits.length === 10 && digits.startsWith('07')) {
    digits = '967' + digits.slice(1);
  }
  return digits ? `https://wa.me/${digits}` : 'https://wa.me/967777000111';
}
