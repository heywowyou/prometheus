import { AxiosError } from "axios";

/** Error body shape returned by the Prometheus API's error middleware. */
interface ApiErrorBody {
  message?: string;
  code?: string;
  details?: Record<string, string>;
}

export interface ApiError {
  message: string;
  code: string;
  status?: number;
  details?: Record<string, string>;
}

/**
 * Normalises anything thrown by an API call into a displayable error.
 *
 * Axios failures, network failures and plain thrown values all arrive here, so
 * callers never have to reach into `err.response.data.message` themselves.
 */
export const toApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;

    if (body?.message) {
      return {
        message: body.message,
        code: body.code ?? "API_ERROR",
        status: error.response?.status,
        details: body.details,
      };
    }

    if (!error.response) {
      return {
        message: "Could not reach the server. Check your connection.",
        code: "NETWORK_ERROR",
      };
    }

    return {
      message: error.message,
      code: "API_ERROR",
      status: error.response.status,
    };
  }

  if (error instanceof Error) {
    return { message: error.message, code: "UNKNOWN_ERROR" };
  }

  return { message: "Something went wrong", code: "UNKNOWN_ERROR" };
};

export const getErrorMessage = (error: unknown): string =>
  toApiError(error).message;
