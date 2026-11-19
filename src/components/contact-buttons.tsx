import { Pressable } from "@/components/pressable";
import type { SiteSettings } from "@/lib/types";
import { instagramUrl, whatsappLink } from "@/lib/whatsapp";

type Props = {
  settings: SiteSettings;
  productTitle?: string;
  productUrl?: string;
};

/** Sipariş/iletişim butonları. Ayarlarda boş olan kanalın butonu hiç gösterilmez. */
export function ContactButtons({ settings, productTitle, productUrl }: Props) {
  const phone = settings.whatsapp_number || null;
  const instagram = settings.instagram_username?.trim() || null;
  if (!phone && !instagram) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {phone && (
        <Pressable
          as="a"
          href={whatsappLink(phone, productTitle, productUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-accent-text"
        >
          <WhatsAppIcon />
          WhatsApp&apos;tan yaz
        </Pressable>
      )}
      {instagram && (
        <Pressable
          as="a"
          href={instagramUrl(instagram)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface px-6 font-semibold shadow-[var(--shadow-soft)]"
        >
          <InstagramIcon />
          Instagram
        </Pressable>
      )}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4a.5.5 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
