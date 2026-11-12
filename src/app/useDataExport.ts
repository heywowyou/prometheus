import { useCallback } from "react";
import { toast } from "sonner";
import { useApiClient } from "@lib/api/api-client";
import { getErrorMessage } from "@lib/api/errors";

/**
 * Downloads a JSON backup of everything the user owns (todos and their
 * history, media logs, notes including archive and trash).
 */
export const useDataExport = () => {
  const client = useApiClient();

  return useCallback(async () => {
    const pending = toast.loading("Preparing your backup…");
    try {
      const { data } = await client.get<Blob>("/export", { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `prometheus-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
      toast.success("Backup downloaded", { id: pending });
    } catch (error) {
      toast.error(`Backup failed: ${getErrorMessage(error)}`, { id: pending });
    }
  }, [client]);
};
