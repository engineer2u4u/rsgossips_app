// Tiny wrapper around react-native-image-picker so screens don't deal with
// the underlying API's quirks (the result type is loose, error states are
// flagged via `didCancel` / `errorCode`, etc.). Returns a normalised asset
// shape that can be handed straight to FormData via the helpers in
// `image-upload.ts`.

import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type ImageLibraryOptions,
  type CameraOptions,
} from 'react-native-image-picker';

export type PickedImage = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

const DEFAULT_LIBRARY_OPTS: ImageLibraryOptions = {
  mediaType: 'photo',
  // Don't pull the full 4K original — RN's fetch will choke and the upload
  // function compresses heavily anyway. Cap at ~1600px on the long edge so
  // 1080×1920 reels-stills survive intact, 4032×3024 phone photos shrink.
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.85 as any,
  selectionLimit: 1,
  includeBase64: false,
};

const DEFAULT_CAMERA_OPTS: CameraOptions = {
  mediaType: 'photo',
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.85 as any,
  saveToPhotos: false,
  includeBase64: false,
};

function normalise(a: Asset): PickedImage | null {
  if (!a.uri) return null;
  const name =
    a.fileName ||
    `image-${Date.now()}.${(a.type || 'image/jpeg').split('/').pop() || 'jpg'}`;
  return {
    uri: a.uri,
    name,
    type: a.type || 'image/jpeg',
    size: a.fileSize,
  };
}

export async function pickFromLibrary(
  opts: Partial<ImageLibraryOptions> = {},
): Promise<PickedImage | null> {
  const res = await launchImageLibrary({...DEFAULT_LIBRARY_OPTS, ...opts});
  if (res.didCancel) return null;
  if (res.errorCode) {
    throw new Error(res.errorMessage || `Picker error: ${res.errorCode}`);
  }
  const first = res.assets?.[0];
  return first ? normalise(first) : null;
}

export async function pickManyFromLibrary(
  limit: number,
  opts: Partial<ImageLibraryOptions> = {},
): Promise<PickedImage[]> {
  const res = await launchImageLibrary({
    ...DEFAULT_LIBRARY_OPTS,
    ...opts,
    selectionLimit: limit,
  });
  if (res.didCancel) return [];
  if (res.errorCode) {
    throw new Error(res.errorMessage || `Picker error: ${res.errorCode}`);
  }
  return (res.assets || []).map(normalise).filter((x): x is PickedImage => !!x);
}

export async function pickFromCamera(
  opts: Partial<CameraOptions> = {},
): Promise<PickedImage | null> {
  const res = await launchCamera({...DEFAULT_CAMERA_OPTS, ...opts});
  if (res.didCancel) return null;
  if (res.errorCode) {
    throw new Error(res.errorMessage || `Camera error: ${res.errorCode}`);
  }
  const first = res.assets?.[0];
  return first ? normalise(first) : null;
}
