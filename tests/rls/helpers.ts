import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };

export const service = () => createAdminClient();
export const anon = () => createClient(url(), anonKey(), opts);

export const runId = () => Math.random().toString(36).slice(2, 8);

/** Geçici kullanıcı oluşturur, giriş yapmış istemcisini döner. */
export async function makeUser(admin: boolean): Promise<{ id: string; client: SupabaseClient }> {
  const svc = service();
  const email = `rls-${runId()}-${admin ? "admin" : "user"}@test.invalid`;
  const password = `Pw-${runId()}-${runId()}`;
  const { data, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("kullanıcı yok");
  if (admin) {
    const ins = await svc.from("admins").insert({ user_id: data.user.id });
    if (ins.error) throw ins.error;
  }
  const client = createClient(url(), anonKey(), opts);
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  return { id: data.user.id, client };
}

export async function deleteUser(id: string) {
  await service().auth.admin.deleteUser(id);
}

export type Fixtures = Awaited<ReturnType<typeof makeFixtures>>;

/** Bir kategori, bir yayında ve bir taslak ürün (birer fotoğraflı) oluşturur. */
export async function makeFixtures() {
  const svc = service();
  const id = runId();
  const cat = await svc.from("categories").insert({ name: `Test ${id}`, slug: `test-${id}` }).select().single();
  if (cat.error) throw cat.error;
  const mk = async (status: "published" | "draft", publishedAt: string | null) => {
    const p = await svc
      .from("products")
      .insert({
        title: `${status} ${id}`,
        slug: `${status}-${id}`,
        category_id: cat.data.id,
        status,
        published_at: publishedAt,
      })
      .select()
      .single();
    if (p.error) throw p.error;
    const img = await svc.from("product_images").insert({
      product_id: p.data.id,
      path_thumb: `test/${id}/${status}-thumb.webp`,
      path_full: `test/${id}/${status}-full.webp`,
      width: 100,
      height: 100,
      sort_order: 0,
    });
    if (img.error) throw img.error;
    return p.data as { id: string; slug: string };
  };
  const published = await mk("published", new Date().toISOString());
  const draft = await mk("draft", null);
  return { category: cat.data as { id: string; slug: string }, published, draft };
}

export async function dropFixtures(f: Fixtures | undefined) {
  if (!f) return;
  const svc = service();
  await svc.from("products").delete().eq("category_id", f.category.id);
  await svc.from("categories").delete().eq("id", f.category.id);
}

/** 1x1 WebP (geçerli dosya). */
export const tinyWebp = () =>
  new Blob([Buffer.from("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==", "base64")], { type: "image/webp" });
