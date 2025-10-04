export function isUserAdmin(user: any): boolean {
  if (!user) return false;
  
  // Check NextAuth session role (primary)
  if (user.role === "admin") return true;
  
  // Check Firebase custom claims (fallback)
  if (user.admin === true) return true;
  
  // Check allowed admin emails (fallback)
  const allowedEmails = process.env.ALLOWED_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  if (user.email && allowedEmails.includes(user.email.toLowerCase())) return true;
  
  return false;
}