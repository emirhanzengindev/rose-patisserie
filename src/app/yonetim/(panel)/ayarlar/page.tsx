import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/auth";
import { querySettings } from "@/lib/queries";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  const settings = await querySettings(await requireAdmin());
  return (
    <main>
      <SettingsForm settings={settings} />
    </main>
  );
}
