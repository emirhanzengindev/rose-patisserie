import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, test, vi } from "vitest";
import { keepalive } from "@/lib/keepalive";

const SECRET = "s3cret-value-0123456789abcdef";

/** `from(...).select(...).limit(...)` zincirini taklit eden sahte istemci. */
function fakeClient(result: { error: { message: string } | null }) {
  const limit = vi.fn().mockResolvedValue({ data: result.error ? null : [{ id: 1 }], error: result.error });
  const select = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ select }));
  return { client: { from } as unknown as SupabaseClient, from, limit };
}

describe("keepalive", () => {
  test("header yoksa 401 döner ve veritabanına gitmez", async () => {
    const { client, from } = fakeClient({ error: null });
    expect(await keepalive(null, SECRET, client)).toEqual({ status: 401, body: { ok: false } });
    expect(from).not.toHaveBeenCalled();
  });

  test("yanlış anahtarda 401 döner", async () => {
    const { client, from } = fakeClient({ error: null });
    expect((await keepalive("Bearer yanlis", SECRET, client)).status).toBe(401);
    expect((await keepalive(SECRET, SECRET, client)).status).toBe(401); // "Bearer " öneki zorunlu
    expect(from).not.toHaveBeenCalled();
  });

  test("sunucuda anahtar tanımlı değilse her istek reddedilir", async () => {
    const { client, from } = fakeClient({ error: null });
    expect((await keepalive("Bearer ", undefined, client)).status).toBe(401);
    expect((await keepalive("Bearer undefined", undefined, client)).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  test("doğru anahtarla site_settings'ten bir satır okur ve 200 döner", async () => {
    const { client, from, limit } = fakeClient({ error: null });
    expect(await keepalive(`Bearer ${SECRET}`, SECRET, client)).toEqual({ status: 200, body: { ok: true } });
    expect(from).toHaveBeenCalledWith("site_settings");
    expect(limit).toHaveBeenCalledWith(1);
  });

  test("veritabanı hatasında 502 döner", async () => {
    const { client } = fakeClient({ error: { message: "paused" } });
    expect(await keepalive(`Bearer ${SECRET}`, SECRET, client)).toEqual({ status: 502, body: { ok: false } });
  });
});
