import { useCallback, useMemo } from "react";
import { useApiClient } from "@lib/api/api-client";

export interface UploadedImage {
  url: string;
  publicId: string;
}

export const useUploadApi = () => {
  const client = useApiClient();

  const uploadCover = useCallback(
    async (file: File): Promise<UploadedImage> => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await client.post<UploadedImage>(
        "/images/upload",
        formData,
      );
      return data;
    },
    [client],
  );

  /** Mirrors a remote image into Cloudinary via the API's validated importer. */
  const uploadCoverFromUrl = useCallback(
    async (url: string): Promise<UploadedImage> => {
      const { data } = await client.post<UploadedImage>(
        "/images/upload-from-url",
        { url },
      );
      return data;
    },
    [client],
  );

  const deleteCover = useCallback(
    async (publicId: string): Promise<void> => {
      await client.delete("/images", { params: { publicId } });
    },
    [client],
  );

  return useMemo(
    () => ({ uploadCover, uploadCoverFromUrl, deleteCover }),
    [uploadCover, uploadCoverFromUrl, deleteCover],
  );
};
