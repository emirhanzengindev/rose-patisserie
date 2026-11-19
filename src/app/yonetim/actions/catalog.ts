"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import {
  deleteCategoryWith,
  reorderCategoriesWith,
  saveCategoryWith,
  saveSettingsWith,
} from "@/lib/catalog-service";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ActionResult, Category, SiteSettings } from "@/lib/types";

// Kategori adı/sırası ürün kartlarında ve kategori düğmelerinde görünür; `categories` etiketi ikisini de tazeler.

export async function saveCategory(input: { id?: string; name: string }): Promise<ActionResult<Category>> {
  const result = await saveCategoryWith(await createServerSupabase(), input);
  if (result.ok) updateTag(TAGS.categories);
  return result;
}

export async function reorderCategories(ids: string[]): Promise<ActionResult<null>> {
  const result = await reorderCategoriesWith(await createServerSupabase(), ids);
  if (result.ok) updateTag(TAGS.categories);
  return result;
}

export async function deleteCategory(id: string): Promise<ActionResult<null>> {
  const result = await deleteCategoryWith(await createServerSupabase(), id);
  if (result.ok) updateTag(TAGS.categories);
  return result;
}

export async function saveSettings(input: unknown): Promise<ActionResult<SiteSettings>> {
  const result = await saveSettingsWith(await createServerSupabase(), input);
  if (result.ok) updateTag(TAGS.settings);
  return result;
}
