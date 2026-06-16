// Upload helpers for the brand profile logo and campaign banner/gallery.
//
// Wraps the two web edge functions:
//   - upload-profile-photo:  FormData { userId, file, table }       → { logoUrl }
//   - upload-campaign-image: FormData { file, folder }              → { url }
//
// On RN, FormData appends `{uri, type, name}` objects (not Blob/File). React
// Native's fetch handles streaming the file off-disk for us.

import {invokeFormFn} from './api';
import type {PickedImage} from './image-picker';

export type Table = 'brand_profiles' | 'influencer_profiles';

function appendFile(form: FormData, image: PickedImage) {
  // RN fetch expects this {uri, type, name} shape — not a real Blob.
  form.append('file', {
    uri: image.uri,
    name: image.name,
    type: image.type,
  } as any);
}

export async function uploadProfilePhoto(
  userId: string,
  image: PickedImage,
  table: Table = 'brand_profiles',
): Promise<{logoUrl: string}> {
  const form = new FormData();
  form.append('userId', userId);
  form.append('table', table);
  appendFile(form, image);
  const data = await invokeFormFn<{logoUrl?: string; url?: string}>(
    'upload-profile-photo',
    form,
  );
  return {logoUrl: data?.logoUrl || data?.url || ''};
}

export async function uploadCampaignImage(
  image: PickedImage,
  folder: 'banners' | 'gallery',
): Promise<{url: string}> {
  const form = new FormData();
  form.append('folder', folder);
  appendFile(form, image);
  const data = await invokeFormFn<{url: string}>('upload-campaign-image', form);
  return {url: data?.url || ''};
}
