import type { Metadata } from "next";
import { ContactButtons } from "@/components/contact-buttons";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Hakkında",
  description: "Rose Patisserie: Bursa Yıldırım'da ev yapımı tatlılar.",
};

const FALLBACK_ABOUT =
  "Rose Patisserie, Bursa'da ev mutfağında küçük partiler hâlinde tatlılar hazırlar. Siparişleriniz için WhatsApp ya da Instagram'dan yazabilirsiniz.";

export default async function AboutPage() {
  const settings = await getSettings();
  const about = settings.about_text.trim() || FALLBACK_ABOUT;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-10 sm:pt-16">
      <h1 className="display">Hakkında</h1>
      <p className="caption mt-3 font-medium tracking-[0.04em] text-gold uppercase">Bursa · Yıldırım</p>
      <div className="mt-6 text-lg leading-relaxed whitespace-pre-line">{about}</div>
      <div className="mt-10">
        <ContactButtons settings={settings} />
      </div>
    </main>
  );
}
