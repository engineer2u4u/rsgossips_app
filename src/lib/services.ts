// Helpers for the influencer services pages. Service rows now come from
// the `services` table via the list-services edge function — see
// iconForName() for mapping the DB's `icon_name` string back to a lucide
// component.
//
// Ported from web app src/lib/services.js — keep in sync.

import {
  Camera,
  Film,
  Instagram,
  LineChart,
  Megaphone,
  Mic,
  Palette,
  PenSquare,
  Sparkles,
  Target,
} from 'lucide-react-native';
import {invokeFn} from './api';

// Same ICON_MAP as web. Add new entries here when admins introduce a new
// icon_name on the services table.
const ICON_MAP: Record<string, any> = {
  Instagram,
  Target,
  Palette,
  LineChart,
  Camera,
  PenSquare,
  Megaphone,
  Mic,
  Film,
  Sparkles,
};

export const iconForName = (name?: string): any =>
  (name && ICON_MAP[name]) || Sparkles;

export const formatINR = (n: number | string | null | undefined): string =>
  `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Row shape returned by list-services. Tolerant to missing fields — admin-curated
// rows in the wild may not have every column populated.
export interface ServiceRow {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  tag?: string;
  accent?: string;
  icon_name?: string;
  hero_gradient?: string;
  featured_image_url?: string;
  gallery_image_urls?: string[];
  price_starting?: number;
  price_max?: number;
  rating_avg?: number;
  reviews_count?: number;
  quote_sla_hours?: number;
  booked_this_month?: number;
  whats_included?: string[];
  deliverables?: string[];
  faq?: {q: string; a: string}[];
  is_active?: boolean;
}

export async function fetchServices(): Promise<ServiceRow[]> {
  try {
    const data = await invokeFn<{services?: ServiceRow[]}>('list-services', {});
    return Array.isArray(data?.services) ? data.services : [];
  } catch (e) {
    console.warn('fetchServices failed:', e);
    return [];
  }
}

export async function fetchServiceBySlug(slug: string): Promise<ServiceRow | null> {
  try {
    const data = await invokeFn<{service?: ServiceRow}>('list-services', {slug});
    return data?.service || null;
  } catch (e) {
    console.warn('fetchServiceBySlug failed:', e);
    return null;
  }
}
