export const ADMIN_LOGIN_PATH = "/yonetim/giris";

const PUBLIC_ADMIN_PATHS = [ADMIN_LOGIN_PATH, "/yonetim/sifre-yenile"];

/** `/yonetim` altındaki, giriş ve şifre yenileme dışındaki her yol oturum ister. */
export function requiresAdminLogin(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path !== "/yonetim" && !path.startsWith("/yonetim/")) return false;
  return !PUBLIC_ADMIN_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}
