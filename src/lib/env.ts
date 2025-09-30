const req = (key: string, hint?: string) => {
  const v = process.env[key];
  if (!v || v.trim() === "") {
    throw new Error(`[ENV] Missing ${key}${hint ? ` (${hint})` : ""}`);
  }
  return v.trim();
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  NEXTAUTH_URL: req("NEXTAUTH_URL", "http(s)://host"),
  NEXTAUTH_SECRET: req("NEXTAUTH_SECRET", "same across ALL envs"),
  ALLOWED_ADMIN_EMAILS: (process.env.ALLOWED_ADMIN_EMAILS || "")
    .split(",").map(s => s.trim().toLowerCase()).filter(Boolean),
  IS_PROD: process.env.NODE_ENV === "production",
  COOKIE_DOMAIN: process.env.NODE_ENV === "production" ? ".broskiskitchen.com" : undefined,
};