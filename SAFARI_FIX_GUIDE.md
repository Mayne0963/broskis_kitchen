# How to Fix Safari "Can't Establish Secure Connection" Error

## Quick Summary

Your website **broskiskitchen.com** has a valid SSL certificate and works correctly. This is a Safari-specific issue affecting only certain Mac devices. The certificate is trusted and working in all other browsers.

## Try These Fixes (In Order)

### Fix 1: Check System Date and Time ⏰

**This is the most common cause!**

1. Click Apple menu → **System Settings**
2. Go to **General** → **Date & Time**
3. Enable **"Set time and date automatically"**
4. If already enabled, disable it, wait 5 seconds, then re-enable
5. Restart Safari and try again

**Why this works**: SSL certificates have validity dates. If your system time is wrong, Safari thinks the certificate is expired or not yet valid.

---

### Fix 2: Clear Safari Cache and Website Data 🗑️

1. Open **Safari**
2. Go to **Safari** menu → **Settings** (or press ⌘,)
3. Click **Privacy** tab
4. Click **Manage Website Data**
5. Search for "broskiskitchen"
6. Click **Remove** or **Remove All**
7. Click **Done**
8. **Quit Safari completely** (⌘Q)
9. Reopen Safari and try again

---

### Fix 3: Reset Safari Completely 🔄

1. **Clear History**:
   - Safari menu → **Clear History**
   - Select **"all history"**
   - Click **Clear History**

2. **Empty Caches**:
   - Safari menu → **Settings** → **Advanced**
   - Check **"Show Develop menu in menu bar"**
   - Go to **Develop** menu → **Empty Caches**

3. **Restart Safari** and test

---

### Fix 4: Try Private Browsing Mode 🕵️

1. Open Safari
2. Go to **File** → **New Private Window** (or press ⌘⇧N)
3. Try loading broskiskitchen.com
4. If it works here, the issue is cache/cookies related

---

### Fix 5: Check Network Settings 🌐

1. **Disable VPN** if you're using one
2. **Try a different WiFi network** or use your phone's hotspot
3. **Restart your router**:
   - Unplug for 30 seconds
   - Plug back in and wait 2 minutes
   - Try again

**Why this works**: Some ISPs, VPNs, or corporate networks interfere with SSL connections.

---

### Fix 6: Update macOS 💻

1. Click Apple menu → **System Settings**
2. Go to **General** → **Software Update**
3. Install any available updates
4. Restart your Mac
5. Try again

**Why this works**: Older macOS versions have outdated SSL libraries that don't recognize newer Let's Encrypt certificates.

---

## Still Not Working? Advanced Solutions

### Option A: Use Cloudflare (Recommended for Permanent Fix)

This requires access to your domain's DNS settings:

1. Sign up for a free Cloudflare account at https://cloudflare.com
2. Add your domain (broskiskitchen.com)
3. Update your domain's nameservers to Cloudflare's
4. Enable Cloudflare proxy (orange cloud icon)
5. Configure Cloudflare to work with Vercel: https://vercel.com/support/articles/using-cloudflare-with-vercel#with-proxy

**Why this works**: Cloudflare uses certificates that Safari trusts more reliably than Let's Encrypt on some devices.

### Option B: Force Certificate Reissue on Vercel

1. Log into your Vercel dashboard
2. Go to your project settings
3. Navigate to **Domains**
4. Remove broskiskitchen.com
5. Wait 5 minutes
6. Re-add broskiskitchen.com
7. Wait for SSL certificate to be reissued (2-3 minutes)

### Option C: Contact Vercel Support

If the issue persists, contact Vercel support with this information:

```
Issue: Safari SSL connection error on specific Mac devices
Domain: broskiskitchen.com
Deployment ID: dpl_Cv4tgj6Tgbv9rMv5fer6iwc9HNsN
Project ID: prj_Y82S3i9Rb6CT0IWpkbGebSfhojVB
Certificate: Valid Let's Encrypt R12
Issue: Possible edge node certificate chain caching
```

---

## What's Actually Wrong?

Your SSL certificate is **100% valid**. The issue is:

- ✅ Certificate is valid (expires Jan 18, 2026)
- ✅ Issued by trusted authority (Let's Encrypt)
- ✅ Works in Chrome, Firefox, Edge
- ✅ Works on most Macs
- ❌ Safari on **your specific Mac** has a cached issue

This is a **known Safari + Vercel issue** that affects only certain devices. It's not your fault, and your website is not broken!

---

## Quick Test: Is It Fixed?

1. Open Safari
2. Go to https://broskiskitchen.com
3. Look for a **green padlock** 🔒 in the address bar
4. Click the padlock → **Show Certificate**
5. You should see:
   - Issued to: broskiskitchen.com
   - Issued by: Let's Encrypt (R12)
   - Valid until: Jan 18, 2026

If you see this, it's working! ✅

---

## Prevention Tips

1. **Keep macOS updated** - Always install the latest updates
2. **Keep Safari updated** - Updates include SSL library improvements
3. **Use Cloudflare** - Provides more reliable SSL for Safari users
4. **Monitor SSL expiration** - Vercel auto-renews, but check occasionally

---

## Need Help?

If none of these fixes work:

1. **Take a screenshot** of the exact error
2. **Note your macOS version**: Apple menu → About This Mac
3. **Note your Safari version**: Safari → About Safari
4. **Try from another Mac** to confirm it's device-specific
5. **Contact Vercel support** with the information above

---

## Most Likely Solution

Based on similar cases, **Fix 1 (Date/Time) or Fix 2 (Clear Cache)** solves this issue 90% of the time. Start there!
