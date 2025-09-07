# Vercel Deployment Fix Guide

Your Vercel deployment is failing due to two main reasons:

1.  **Missing Required Environment Variables**
2.  **`NEXTAUTH_URL` Security Check Failure**

Let's address these issues step-by-step.

## 1. Setting Missing Environment Variables in Vercel

The build log indicates that the following required environment variables are missing:

*   `STRIPE_PUBLISHABLE_KEY`
*   `GOOGLE_MAPS_API_KEY`
*   `ADMIN_EMAILS`

Even if you are not actively using all these services, your project's `validate-env.js` script (or similar environment validation logic) is expecting them. To fix this, you need to add these variables to your Vercel project settings.

**Steps to add Environment Variables in Vercel:**

1.  **Go to your Vercel Dashboard**: Open your web browser and navigate to [vercel.com](https://vercel.com/).
2.  **Select your Project**: From your dashboard, click on the project that is failing to deploy (e.g., `v0-broskis`).
3.  **Navigate to Settings**: In the project dashboard, click on the **Settings** tab.
4.  **Go to Environment Variables**: In the left sidebar, click on **Environment Variables**.
5.  **Add Each Missing Variable**: For each of the missing variables listed above:
    *   Click on the **Add New** button.
    *   Enter the `Name` of the environment variable (e.g., `STRIPE_PUBLISHABLE_KEY`).
    *   Enter the `Value` for the variable. If you don't have a real value for a variable you don't intend to use immediately, you can put a placeholder like `""` or `"N/A"` to satisfy the validation script, but it's best to provide actual valid keys if the feature is intended to be used.
    *   Select the **Environments** where this variable should be available. Based on your log, these variables are required for `Development`, `Preview`, and `Production` environments. Ensure all three are selected.
    *   Click **Add**.
6.  **Repeat for all missing variables.**

**Important Note on `STRIPE_PUBLISHABLE_KEY`:** Your log shows `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is already set. However, the validation script is looking for `STRIPE_PUBLISHABLE_KEY` (without `NEXT_PUBLIC_`). This suggests that the validation script or some part of your backend code is expecting the non-public version of this key. You should add `STRIPE_PUBLISHABLE_KEY` as a separate environment variable in Vercel, even if its value is the same as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

After adding all the missing environment variables, your project should automatically trigger a new deployment. If not, you can manually trigger one.




## 2. Ensuring `NEXTAUTH_URL` Uses HTTPS in Production

The build log shows a security check failure: `❌ NEXTAUTH_URL should use HTTPS in production`.

This is a critical security measure, especially for authentication-related URLs like `NEXTAUTH_URL`. In a production environment, all communication should be encrypted using HTTPS to protect sensitive user data. Vercel automatically provides HTTPS for your deployments, but your `NEXTAUTH_URL` environment variable needs to reflect this.

**How to fix `NEXTAUTH_URL`:**

1.  **Identify your Production Domain**: This is the custom domain you have configured for your Vercel project (e.g., `broskiskitchen.com` as seen in your previous deployment details).
2.  **Update `NEXTAUTH_URL` in Vercel**: 
    *   Go back to your Vercel project settings, then **Environment Variables**.
    *   Find the `NEXTAUTH_URL` variable.
    *   **Edit its value** to use `https://` with your production domain. For example, if your production domain is `broskiskitchen.com`, the value should be `https://broskiskitchen.com`.
    *   Ensure this change applies to the **Production** environment. It's also good practice to set it for `Development` and `Preview` with their respective URLs (e.g., `http://localhost:3000` for development, and your Vercel preview URL for preview environments, though Vercel often handles preview URLs automatically for `NEXTAUTH_URL`).

**Example:**

If your production domain is `www.example.com`:

*   **Name**: `NEXTAUTH_URL`
*   **Value**: `https://www.example.com`
*   **Environments**: Production

By ensuring `NEXTAUTH_URL` is set to an HTTPS URL for your production environment, you satisfy this security check and allow NextAuth.js (or similar authentication libraries) to function correctly and securely.

After making this change, Vercel should trigger a new deployment, and with both the environment variables and `NEXTAUTH_URL` correctly configured, your build should succeed.

