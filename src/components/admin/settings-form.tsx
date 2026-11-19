"use client";

import { useState, useTransition, type FormEvent } from "react";
import { saveSettings } from "@/app/yonetim/actions/catalog";
import { FreshOnReturn } from "@/components/admin/fresh-on-return";
import type { SiteSettings } from "@/lib/types";
import { formatTrPhone } from "@/lib/whatsapp";

const inputClass = "min-h-12 w-full rounded-2xl bg-surface px-4 text-base shadow-[var(--shadow-soft)]";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  return (
    <FreshOnReturn>
      <SettingsFormInner settings={settings} />
    </FreshOnReturn>
  );
}

function SettingsFormInner({ settings }: { settings: SiteSettings }) {
  const [phone, setPhone] = useState(formatTrPhone(settings.whatsapp_number));
  const [instagram, setInstagram] = useState(settings.instagram_username ?? "");
  const [tagline, setTagline] = useState(settings.tagline);
  const [about, setAbout] = useState(settings.about_text);
  const [status, setStatus] = useState<{ error?: string; saved?: boolean }>({});
  const [pending, startTransition] = useTransition();

  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setStatus({});
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveSettings({ whatsapp_number: phone, instagram_username: instagram, tagline, about_text: about });
      if (!result.ok) return setStatus({ error: result.error });
      // Kaydedilen (düzeltilmiş) değerleri göster: ör. "@Ad" → "ad", "5321234567" → "0532 123 45 67".
      setPhone(formatTrPhone(result.data.whatsapp_number));
      setInstagram(result.data.instagram_username ?? "");
      setTagline(result.data.tagline);
      setAbout(result.data.about_text);
      setStatus({ saved: true });
    });
  }

  return (
    <form onSubmit={submit} className="pb-10">
      {/* Kaydet üstte: telefonda klavye açıkken de görünür. */}
      <div className="glass sticky top-0 z-30 -mx-4 flex h-14 items-center justify-between gap-2 px-4">
        <h1 className="text-[1.0625rem] font-semibold">Site ayarları</h1>
        <button
          type="submit"
          disabled={pending}
          className="pressable min-h-11 rounded-full bg-accent px-5 font-semibold text-accent-text disabled:opacity-50"
        >
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>

      {status.error && (
        <p role="alert" className="mt-3 rounded-2xl bg-danger/10 px-4 py-3 text-[0.9375rem] font-medium text-danger">
          {status.error}
        </p>
      )}
      {status.saved && (
        <p role="status" className="mt-3 rounded-2xl bg-surface px-4 py-3 text-[0.9375rem] shadow-[var(--shadow-soft)]">
          ✓ Kaydedildi. Değişiklik sitede birkaç saniye içinde görünür.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.9375rem] font-semibold">WhatsApp numarası</span>
          <input
            value={phone}
            onChange={(e) => edit(setPhone)(e.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0532 123 45 67"
            className={inputClass}
          />
          <span className="caption text-text-muted">Siparişler bu numaraya gelir. Boş bırakılırsa WhatsApp butonu sitede görünmez.</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.9375rem] font-semibold">Instagram kullanıcı adı</span>
          <div className="flex items-center rounded-2xl bg-surface shadow-[var(--shadow-soft)]">
            <span aria-hidden="true" className="pl-4 text-text-muted">
              @
            </span>
            <input
              value={instagram}
              onChange={(e) => edit(setInstagram)(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="rose.patisserie.tr"
              className="min-h-12 min-w-0 flex-1 rounded-2xl bg-transparent pr-4 pl-1 text-base"
            />
          </div>
          <span className="caption text-text-muted">Boş bırakılırsa Instagram butonu sitede görünmez.</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.9375rem] font-semibold">Karşılama cümlesi</span>
          <input
            value={tagline}
            onChange={(e) => edit(setTagline)(e.target.value)}
            maxLength={120}
            required
            className={inputClass}
          />
          <span className="caption text-text-muted">Ana sayfada başlığın altında görünür.</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.9375rem] font-semibold">Hakkında metni</span>
          <textarea
            value={about}
            onChange={(e) => edit(setAbout)(e.target.value)}
            maxLength={3000}
            rows={8}
            className="rounded-2xl bg-surface px-4 py-3 text-base leading-relaxed shadow-[var(--shadow-soft)]"
          />
          <span className="caption text-text-muted">“Hakkında” sayfasında görünür. Paragraflar arasında boş satır bırakabilirsiniz.</span>
        </label>
      </div>
    </form>
  );
}
