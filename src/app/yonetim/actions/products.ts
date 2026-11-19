"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { deleteProductWith, saveProductWith } from "@/lib/product-service";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function saveProduct(input: unknown): Promise<ActionResult<{ id: string; slug: string }>> {
  const result = await saveProductWith(await createServerSupabase(), input);
  // Ziyaretçi sayfalarındaki ürün önbelleği hemen tazelenir.
  if (result.ok) updateTag(TAGS.products);
  return result;
}

export async function deleteProduct(id: unknown): Promise<ActionResult<null>> {
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, error: "Ürün bulunamadı." };
  const result = await deleteProductWith(await createServerSupabase(), id);
  if (result.ok) updateTag(TAGS.products);
  return result;
}
