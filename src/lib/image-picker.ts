// Tiny wrapper around react-native-image-picker so screens don't deal with
// the underlying API's quirks (the result type is loose, error states are
// flagged via `didCancel` / `errorCode`, etc.). Returns a normalised asset
// shape that can be handed straight to FormData via the helpers in
// `image-upload.ts`.
//
// For the profile-photo flow specifically we use react-native-image-crop-
// picker because it ships a native iOS / Android square cropper UI — the
// standard react-native-image-picker doesn't expose any cropping. Callers
// opt in by passing `{crop: 'square', size: 800}` to pickFromLibrary().

import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type ImageLibraryOptions,
  type CameraOptions,
} from 'react-native-image-picker';
import ImageCropPicker, {
  type Image as CropPickerImage,
} from 'react-native-image-crop-picker';

export type PickedImage = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

/** Extra pickFromLibrary options for the cropper path. */
export interface CropOptions {
  /** Forces a square crop (1:1). Use for avatars / profile photos. */
  crop?: 'square';
  /** Output edge length in pixels. Default 800. */
  size?: number;
}

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

function fromCropPicker(img: CropPickerImage): PickedImage {
  const name = `image-${Date.now()}.${(img.mime || 'image/jpeg').split('/').pop() || 'jpg'}`;
  return {
    uri: img.path,
    name,
    type: img.mime || 'image/jpeg',
    size: img.size,
  };
}

export async function pickFromLibrary(
  opts: Partial<ImageLibraryOptions> & CropOptions = {},
): Promise<PickedImage | null> {
  // Cropping path — defer to react-native-image-crop-picker which has a
  // native iOS / Android square cropper UI baked in. The user picks the
  // photo, frames it inside a draggable square, and we get back the cropped
  // file ready for upload.
  if (opts.crop === 'square') {
    const size = opts.size ?? 800;
    try {
      const img = await ImageCropPicker.openPicker({
        width: size,
        height: size,
        cropping: true,
        cropperCircleOverlay: false,
        // Square aspect ratio means the picker can't be skewed to a rect
        // by pinching — keeps the avatar correctly proportioned.
        compressImageQuality: 0.85,
        mediaType: 'photo',
        forceJpg: true,
        includeBase64: false,
      });
      return fromCropPicker(img);
    } catch (err: any) {
      // The library throws `E_PICKER_CANCELLED` when the user backs out.
      if (err?.code === 'E_PICKER_CANCELLED') return null;
      throw err;
    }
  }

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
