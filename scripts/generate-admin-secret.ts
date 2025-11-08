import crypto from "crypto";

// Generate a cryptographically secure random string, 64+ chars
const bytes = crypto.randomBytes(64); // 512 bits
const secret = bytes.toString("base64url"); // URL-safe

console.log("ADMIN_SETUP_SECRET:");
console.log(secret);
console.log("Length:", secret.length);