import { cacheLife, cacheTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { getSettings } from "@/lib/data";
import { instagramUrl, whatsappLink } from "@/lib/whatsapp";

/** Alt bilgi: Instagram, WhatsApp ve © yılı. Yıl önbellekle birlikte günde bir yenilenir. */
export async function SiteFooter() {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.settings);

  const settings = await getSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-4 py-8 text-text-muted sm:flex-row sm:justify-between">
        <ul className="flex gap-5 text-[0.9375rem]">
          {settings.instagram_username && (
            <li>
              <a href={instagramUrl(settings.instagram_username)} target="_blank" rel="noopener noreferrer" className="hover:text-text">
                Instagram
              </a>
            </li>
          )}
          {settings.whatsapp_number && (
            <li>
              <a href={whatsappLink(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="hover:text-text">
                WhatsApp
              </a>
            </li>
          )}
        </ul>
        <p className="caption">© {year} Rose Patisserie · Bursa</p>
      </div>
    </footer>
  );
}
