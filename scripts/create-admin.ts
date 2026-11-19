// Kullanım: npx tsx scripts/create-admin.ts <email> <şifre>
import { config } from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";

config({ path: ".env.local" });

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Kullanım: npx tsx scripts/create-admin.ts <email> <şifre>");
    process.exit(1);
  }
  const supabase = createAdminClient();

  let userId: string | undefined;
  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.data.user) {
    userId = created.data.user.id;
  } else {
    // Kullanıcı zaten varsa bul.
    for (let page = 1; !userId; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      userId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
      if (data.users.length < 200) break;
    }
    if (!userId) throw created.error ?? new Error("Kullanıcı oluşturulamadı.");
  }

  const { error } = await supabase.from("admins").upsert({ user_id: userId });
  if (error) throw error;
  console.log(`Admin hazır: ${email} (${userId})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
