import { useCallback } from "react";
import { useApiClient } from "../../../lib/api/api-client";

export interface UploadCoverResult {
  url: string;
  publicId: string;
}

export const useUploadApi = () => {
  const client = useApiClient();

  const uploadCover = useCallback(
    async (file: File): Promise<UploadCoverResult> => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await client.post<UploadCoverResult>(
        "/images/upload",
        formData
      );
      return response.data;
    },
    [client]
  );

  const uploadCoverFromUrl = useCallback(
    async (url: string): Promise<UploadCoverResult> => {
      const response = await client.post<UploadCoverResult>(
        "/images/upload-from-url",
        { url }
      );
      return response.data;
    },
    [client]
  );

  const deleteCover = useCallback(
    async (publicId: string): Promise<void> => {
      await client.delete("/images", { params: { publicId } });
    },
    [client]
  );

  return { uploadCover, uploadCoverFromUrl, deleteCover };
};
