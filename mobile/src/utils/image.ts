import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { IMAGE_COMPRESS_QUALITY, IMAGE_MAX_EDGE } from '../config';

export interface PreparedImage {
  uri: string;
  mimeType: string;
  fileName: string;
}

/**
 * Downscale and re-encode a picked/captured image before upload.
 *
 * Phone cameras produce multi-megabyte photos that exceed the gateway's 10 MB
 * upload limit and waste rural bandwidth. We cap the long edge and save as
 * JPEG, which keeps the leaf detail the vision model needs while staying small.
 */
export async function prepareImageForUpload(sourceUri: string): Promise<PreparedImage> {
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
    return {
      uri: result.uri,
      mimeType: 'image/jpeg',
      fileName: `plant_${Date.now()}.jpg`,
    };
  } catch (error) {
    console.warn('image preparation failed, using original:', error);
    return {
      uri: sourceUri,
      mimeType: 'image/jpeg',
      fileName: `plant_${Date.now()}.jpg`,
    };
  }
}
