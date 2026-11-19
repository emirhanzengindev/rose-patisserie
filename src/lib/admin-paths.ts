export const ADMIN_LOGIN_PATH = "/yonetim/giris";
export const ADMIN_HOME_PATH = "/yonetim";

/** Girişten/e-posta bağlantısından sonra gidilecek yol: yalnızca site içi, mutlak yollar (açık yönlendirme yok). */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return ADMIN_HOME_PATH;
  return raw;
}

const PUBLIC_ADMIN_PATHS = [ADMIN_LOGIN_PATH, "/yonetim/sifre-yenile"];

/** `/yonetim` altındaki, giriş ve şifre yenileme dışındaki her yol oturum ister. */
export function requiresAdminLogin(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path !== "/yonetim" && !path.startsWith("/yonetim/")) return false;
  return !PUBLIC_ADMIN_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}
