import { sanitizeEmailAddress, toWhatsAppNumber } from "@/lib/rules/contacts";

export type ContactActionsProps = {
  email?: string | null;
  phone?: string | null;
  /** WhatsApp number; falls back to `phone` when omitted. */
  whatsapp?: string | null;
  subject?: string;
  message?: string;
  /** Small caption, e.g. "Customer" or "OEM". */
  label?: string;
};

const ICONS: Record<string, string> = {
  email:
    "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z",
  phone:
    "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.24 1l-2.24 2.2Z",
  whatsapp:
    "M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.4A10 10 0 1 0 12 2Zm0 2a8 8 0 1 1-4.1 14.8l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 0 1 12 4Zm-2.3 4.2c-.2 0-.5.1-.7.3-.3.3-.7.7-.7 1.6s.7 1.9.8 2c.1.2 1.4 2.2 3.4 3 1.7.7 2 .5 2.4.5.4 0 1.2-.5 1.4-1s.2-.9.1-1l-1.5-.7c-.2-.1-.4-.1-.5.1l-.6.8c-.1.1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.6-1.5c-.2-.4-.3-.4-.5-.4h-.4Z",
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function Channel({
  name,
  href,
  title,
  enabled,
}: {
  name: keyof typeof ICONS;
  href: string;
  title: string;
  enabled: boolean;
}) {
  const label = name === "whatsapp" ? "WhatsApp" : name.charAt(0).toUpperCase() + name.slice(1);
  if (!enabled) {
    return (
      <span
        title={title}
        aria-disabled="true"
        className="inline-flex h-6 w-6 cursor-not-allowed items-center justify-center rounded border border-hairline text-muted-ink opacity-40"
      >
        <Icon name={name} />
        <span className="sr-only">{title}</span>
      </span>
    );
  }
  return (
    <a
      href={href}
      title={title}
      className="inline-flex h-6 w-6 items-center justify-center rounded border border-hairline text-progress hover:bg-content"
    >
      <Icon name={name} />
      <span className="sr-only">{label}</span>
    </a>
  );
}

/**
 * Placeholder contact links: email (`mailto:`), WhatsApp (`wa.me`) and phone
 * (`tel:`). A channel with no value on file renders disabled, so the team can
 * see at a glance whether the party is reachable. Nothing is sent automatically.
 */
export function ContactActions({ email, phone, whatsapp, subject, message, label }: ContactActionsProps) {
  const mailQuery = new URLSearchParams();
  if (subject) mailQuery.set("subject", subject);
  if (message) mailQuery.set("body", message);
  const mailQueryString = mailQuery.toString();
  const emailAddress = sanitizeEmailAddress(email);
  const mailto = `mailto:${emailAddress ?? ""}${mailQueryString ? `?${mailQueryString}` : ""}`;

  const waNumber = toWhatsAppNumber(whatsapp ?? phone);
  const waQuery = message ? `?text=${encodeURIComponent(message)}` : "";
  const waHref = waNumber ? `https://wa.me/${waNumber}${waQuery}` : "";

  return (
    <span className="inline-flex items-center gap-1">
      {label && <span className="text-xs text-muted-ink">{label}</span>}
      <Channel
        name="email"
        enabled={Boolean(emailAddress)}
        href={mailto}
        title={emailAddress ? `Email ${emailAddress}` : "No email on file"}
      />
      <Channel
        name="whatsapp"
        enabled={Boolean(waNumber)}
        href={waHref}
        title={waNumber ? `WhatsApp +${waNumber}` : "No phone on file"}
      />
      <Channel
        name="phone"
        enabled={Boolean(phone)}
        href={`tel:${phone ?? ""}`}
        title={phone ? `Call ${phone}` : "No phone on file"}
      />
    </span>
  );
}
