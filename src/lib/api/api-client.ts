import axios, { type AxiosInstance } from "axios";
import { useAuth } from "@clerk/clerk-react";
import { useMemo } from "react";

const BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

/**
 * The browser's IANA zone. The API uses it for day/week boundaries (recurring
 * todos reset at the user's midnight, not the server's).
 */
const timeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

export const useApiClient = (): AxiosInstance => {
  const { getToken } = useAuth();

  return useMemo(() => {
    const client = axios.create({ baseURL: BASE_URL });

    client.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const zone = timeZone();
      if (zone) config.headers["X-Timezone"] = zone;
      return config;
    });

    return client;
  }, [getToken]);
};
