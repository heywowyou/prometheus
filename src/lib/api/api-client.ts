import axios, { type AxiosInstance } from "axios";
import { useAuth } from "@clerk/clerk-react";
import { useMemo } from "react";

const BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

export const useApiClient = (): AxiosInstance => {
  const { getToken } = useAuth();

  return useMemo(() => {
    const client = axios.create({ baseURL: BASE_URL });

    client.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return client;
  }, [getToken]);
};
