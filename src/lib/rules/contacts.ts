/**
 * Contact helpers for the communication placeholders (email / WhatsApp / phone).
 *
 * Pure and unit-tested so the same rules drive every screen: pick the party's
 * primary contact, and turn whatever phone format is on file into a `wa.me`
 * number.
 */

export type ContactLike = {
  email?: string | null;
  phone?: string | null;
  is_primary?: boolean | null;
};

/** The primary contact with a usable channel, else the first usable one. */
export function pickPrimaryContact<T extends ContactLike>(contacts: T[]): T | null {
  if (contacts.length === 0) return null;
  const primaryWithChannel = contacts.find((c) => c.is_primary && (c.email || c.phone));
  if (primaryWithChannel) return primaryWithChannel;
  return contacts.find((c) => c.email || c.phone) ?? null;
}

/**
 * Cleans a stored email before it is used in a `mailto:` URI. Delimiters that
 * could inject extra `mailto:` parameters (recipients, body) are removed, along
 * with CR/LF. Returns null when nothing usable remains.
 */
export function sanitizeEmailAddress(email: string | null | undefined): string | null {
  if (!email) return null;
  const cleaned = email.replace(/[\r\n\t]/g, "").replace(/[?#&]/g, "").trim();
  return cleaned || null;
}

/**
 * Normalises a phone number for `wa.me`: digits only, with the India country
 * code (91) defaulted for a bare 10-digit number. Returns null when there is
 * nothing dialable.
 */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}
