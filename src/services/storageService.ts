import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export interface PhotoUploadInput {
  blob?: Blob;
  dataUrl: string;
}

export const storageService = {
  /**
   * Uploads captured produce photos to Firebase Storage under:
   * product-images/{uid}/{productId}/image-{1..4}.jpg
   * Returns an array of download URLs.
   */
  async uploadProducePhotos(
    uid: string,
    productId: string,
    photos: PhotoUploadInput[]
  ): Promise<string[]> {
    const urls: string[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const fileName = `image-${i + 1}.jpg`;
      const storageRef = ref(storage, `product-images/${uid}/${productId}/${fileName}`);

      let blob = photo.blob;
      if (!blob && photo.dataUrl) {
        // Convert dataURL to Blob
        const res = await fetch(photo.dataUrl);
        blob = await res.blob();
      }

      if (blob) {
        try {
          const snapshot = await uploadBytes(storageRef, blob, {
            contentType: 'image/jpeg',
            customMetadata: {
              farmerId: uid,
              productId,
              viewIndex: String(i + 1),
            },
          });
          const downloadUrl = await getDownloadURL(snapshot.ref);
          urls.push(downloadUrl);
        } catch (uploadErr) {
          console.warn(`Storage upload failed for ${fileName}, using fallback:`, uploadErr);
          // Fallback to dataUrl token or local reference if network/storage is unavailable
          urls.push(photo.dataUrl.slice(0, 200));
        }
      } else {
        urls.push(photo.dataUrl);
      }
    }

    return urls;
  },
};
