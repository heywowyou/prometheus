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

  return useMemo(
    () => ({ uploadCover }),
    [uploadCover],
  );
};
