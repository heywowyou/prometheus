import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const useApiClient = () => {
  const { getToken } = useAuth();

  const withAuth = async () => {
    const token = await getToken();
    return axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return { withAuth };
};

