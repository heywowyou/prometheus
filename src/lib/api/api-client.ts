import axios, { type AxiosInstance } from "axios";
import { useAuth } from "@clerk/clerk-react";

const BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

interface ApiClientHook {
  withAuth: () => Promise<AxiosInstance>;
}

export const useApiClient = (): ApiClientHook => {
  const { getToken } = useAuth();

  const withAuth = async (): Promise<AxiosInstance> => {
    const token = await getToken();

    return axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  };

  return { withAuth };
};

