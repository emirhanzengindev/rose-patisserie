import { config } from "dotenv";

config({ path: ".env.local" });
for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (!process.env[key]) throw new Error(`${key} .env.local içinde tanımlı değil.`);
}
