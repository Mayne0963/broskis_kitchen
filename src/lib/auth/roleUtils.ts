export function isUserAdmin(user: any): boolean {
  if (!user) return false;
  
  if (user.role === "admin") return true;
  if (user.admin === true) return true;
  return false;
}
