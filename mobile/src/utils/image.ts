import { Platform } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { IMAGE_COMPRESS_QUALITY, IMAGE_MAX_EDGE } from '../config';

export interface PreparedImage {
  uri: string;
  mimeType: string;
  fileName: string;
}

/**
 * Resolve the selected asset (including Android content:// picker URIs) into
 * a compressed JPEG in the app cache before it reaches React Native FormData.
 *
 * Never fall back to the original picker URI: if native decoding fails, stop
 * here with a visible preparation error instead of attempting a broken upload.
 */
export async function prepareImageForUpload(sourceUri: string): Promise<PreparedImage> {
  if (!sourceUri) {
    throw new Error('No image was selected. Please choose the photo again.');
  }

  try {
    const context = ImageManipulator.manipulate(sourceUri, {
      maxWidth: IMAGE_MAX_EDGE,
      maxHeight: IMAGE_MAX_EDGE,
    });
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
