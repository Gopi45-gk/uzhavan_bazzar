import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export interface PhotoUploadInput {
  blob?: Blob;
  dataUrl: string;
}

export const storageService = {
  /**
   * Uploads captured produce photos to Firebase Storage under:
   * productImages/{farmerId}/{productId}/image{1..4}.jpg
   * Returns an array of Firebase Storage download URLs.
   */
  async uploadProducePhotos(
    farmerId: string,
    productId: string,
    photos: PhotoUploadInput[]
  ): Promise<string[]> {
    const urls: string[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const fileName = `image${i + 1}.jpg`;
      const storageRef = ref(storage, `productImages/${farmerId}/${productId}/${fileName}`);

      let blob = photo.blob;
      if (!blob && photo.dataUrl) {
        try {
          if (photo.dataUrl.startsWith('data:')) {
            const res = await fetch(photo.dataUrl);
            blob = await res.blob();
          }
        } catch (fetchErr) {
          console.warn('Could not parse dataUrl to blob:', fetchErr);
        }
      }

      if (blob) {
        try {
          const snapshot = await uploadBytes(storageRef, blob, {
            contentType: 'image/jpeg',
            customMetadata: {
              farmerId,
              productId,
              imageIndex: String(i + 1),
            },
          });
          const downloadUrl = await getDownloadURL(snapshot.ref);
          urls.push(downloadUrl);
        } catch (uploadErr) {
          console.warn(`Storage upload failed for ${fileName}, falling back to dataUrl:`, uploadErr);
          urls.push(photo.dataUrl);
        }
      } else if (photo.dataUrl) {
        urls.push(photo.dataUrl);
      }
    }

    return urls;
  },

  /**
   * Uploads cattle / livestock photo to Firebase Storage under:
   * cattleImages/{farmerId}/{listingId}/image1.jpg
   */
  async uploadCattlePhoto(farmerId: string, listingId: string, fileOrDataUrl: Blob | string): Promise<string> {
    const storageRef = ref(storage, `cattleImages/${farmerId}/${listingId}/image1.jpg`);

    let blob: Blob | null = null;
    if (typeof fileOrDataUrl === 'string') {
      if (fileOrDataUrl.startsWith('data:')) {
        try {
          const res = await fetch(fileOrDataUrl);
          blob = await res.blob();
        } catch {
          return fileOrDataUrl;
        }
      } else {
        return fileOrDataUrl;
      }
    } else {
      blob = fileOrDataUrl;
    }

    if (!blob) {
      return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
    }

    try {
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
        customMetadata: {
          farmerId,
          listingId,
        },
      });
      return await getDownloadURL(snapshot.ref);
    } catch (err) {
      console.warn('Cattle image upload failed, falling back to data URL:', err);
      return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
    }
  },
};
