import { Image, Platform } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { IMAGE_COMPRESS_QUALITY, IMAGE_MAX_EDGE } from '../config';

export interface PreparedImage {
  uri: string;
  mimeType: string;
  fileName: string;
}

/**
 * Decode the selected asset, resize its longest edge and re-encode it as a
 * JPEG in the app cache before upload.
 *
 * Android's photo picker can return a content:// URI. That URI is valid for
 * preview, but passing it directly to React Native FormData is unreliable.
 * ImageManipulator resolves it and writes a normal cache file URI.
 */
export async function prepareImageForUpload(sourceUri: string): Promise<PreparedImage> {
  if (!sourceUri) {
    throw new Error('No image was selected. Please choose the photo again.');
  }

  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(
        sourceUri,
        (width, height) => resolve({ width, height }),
        () => reject(new Error('Unable to read the selected photo on this device. Please choose it again.')),
      );
    });

    const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(dimensions.width, dimensions.height));
    const context = ImageManipulator.manipulate(sourceUri);

    if (scale < 1) {
      context.resize({
        width: Math.max(1, Math.round(dimensions.width * scale)),
        height: Math.max(1, Math.round(dimensions.height * scale)),
      });
    }

    const image = await context.renderAsync();
    const result = await image.saveAsync({
      compress: IMAGE_COMPRESS_QUALITY,
      format: SaveFormat.JPEG,
    });

    if (!result.uri) {
      throw new Error('The selected photo could not be prepared for upload.');
    }

    return {
      uri: result.uri,
      mimeType: 'image/jpeg',
      fileName: `plant_${Date.now()}.jpg`,
    };
  } catch (error) {
    // Do not fall back to the original content:// URI on Android: that can
    // reproduce the upload failure while making the UI appear to proceed.
    console.warn('image preparation failed:', {
      platform: Platform.OS,
      uriScheme: sourceUri.split(':')[0] || 'unknown',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error instanceof Error
      ? error
      : new Error('Unable to prepare the selected photo. Please choose it again.');
  }
}
