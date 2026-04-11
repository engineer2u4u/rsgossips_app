declare module '@env' {
  // Firebase
  export const NEXT_PUBLIC_FIREBASE_API_KEY: string;
  export const NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  export const NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  export const NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  export const NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  export const NEXT_PUBLIC_FIREBASE_APP_ID: string;
  export const NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: string;

  // Supabase
  export const NEXT_PUBLIC_SUPABASE_URL: string;
  export const NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: string;
  export const SUPABASE_SERVICE_ROLE_KEY: string;

  // Instagram
  export const NEXT_PUBLIC_INSTA_TOKEN: string;
  export const NEXT_PUBLIC_APP_ID: string;
  export const NEXT_PUBLIC_INSTA_OAUTH_TOKEN: string;
  export const NEXT_PUBLIC_INSTAGRAM_APP_ID: string;

  // WhatsApp
  export const NEXT_PUBLIC_WHATSAPP_PHONE_ID: string;
  export const NEXT_PUBLIC_WABA_ID: string;
  export const NEXT_PUBLIC_WHATSAPP_TEMPLATE: string;
  export const NEXT_PUBLIC_META_SYSTEM_USER_TOKEN: string;

  // Legacy aliases (keep for backward compat during migration)
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
  export const INSTAGRAM_APP_ID: string;
  export const INSTAGRAM_REDIRECT_URI: string;
}
