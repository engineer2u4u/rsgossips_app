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

  // Razorpay (test mode publishable key + plan ids per tier × cycle)
  export const NEXT_PUBLIC_RAZORPAY_KEY_ID: string;
  export const NEXT_PUBLIC_RAZORPAY_PLAN_STARTER_MONTHLY: string;
  export const NEXT_PUBLIC_RAZORPAY_PLAN_STARTER_ANNUAL: string;
  export const NEXT_PUBLIC_RAZORPAY_PLAN_PRO_MONTHLY: string;
  export const NEXT_PUBLIC_RAZORPAY_PLAN_PRO_ANNUAL: string;
  export const NEXT_PUBLIC_RAZORPAY_PLAN_ELITE_MONTHLY: string;
  export const NEXT_PUBLIC_RAZORPAY_PLAN_ELITE_ANNUAL: string;

  // Stripe price ids per tier × cycle (the secret never touches the
  // device; checkout runs on Stripe's hosted page)
  export const NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY: string;
  export const NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL: string;
  export const NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: string;
  export const NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL: string;
  export const NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY: string;
  export const NEXT_PUBLIC_STRIPE_PRICE_ELITE_ANNUAL: string;

  // Legacy aliases (keep for backward compat during migration)
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
  export const INSTAGRAM_APP_ID: string;
  export const INSTAGRAM_REDIRECT_URI: string;
}

// react-native-razorpay doesn't ship its own types in older versions —
// this minimal shim covers the open() promise contract we use.
declare module 'react-native-razorpay' {
  export interface RazorpayOptions {
    key: string;
    name?: string;
    description?: string;
    image?: string;
    currency?: string;
    /** Amount in the smallest currency unit (paise for INR). Required for
     *  one-time orders; omitted when using `subscription_id`. */
    amount?: number;
    order_id?: string;
    subscription_id?: string;
    prefill?: { email?: string; contact?: string; name?: string };
    notes?: Record<string, string>;
    theme?: { color?: string };
  }
  export interface RazorpaySuccess {
    razorpay_payment_id: string;
    razorpay_subscription_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }
  export interface RazorpayError {
    code: number;
    description: string;
  }
  const RazorpayCheckout: {
    open: (options: RazorpayOptions) => Promise<RazorpaySuccess>;
  };
  export default RazorpayCheckout;
}
