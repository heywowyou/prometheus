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

  return { uploadCover };
};
