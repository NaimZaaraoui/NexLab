import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

// Provide a dummy key during build time to avoid the "Missing API key" error if the environment variable is not yet available.
// In runtime, if it's still "re_placeholder", the email sending will fail with a more descriptive error from Resend.
export const resend = new Resend(apiKey || 're_placeholder_for_build');
