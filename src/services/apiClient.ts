import type { ApiRequestOptions } from "../types/api";

export const API_BASE_URL = "http://localhost:4000";

const buildHeaders = (headers?: HeadersInit): Headers => {
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  return requestHeaders;
};

const request = async <TResponse, TBody = unknown>(
  endpoint: string,
  options: ApiRequestOptions<TBody> = {}
): Promise<TResponse> => {
  const { method = "GET", body, headers } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: buildHeaders(headers),
    body:
      body !== undefined
        ? JSON.stringify(body)
        : undefined
  });

  if (!response.ok) {
    let errorMessage =
      response.statusText ||
      "Something went wrong while processing the request.";

    try {
      const contentType =
        response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        const errorResponse =
          (await response.json()) as {
            message?: string;
            error?: string;
          };

        errorMessage =
          errorResponse.message ??
          errorResponse.error ??
          errorMessage;
      } else {
        const responseText =
          await response.text();

        if (responseText.trim()) {
          errorMessage = responseText;
        }
      }
    } catch {
      // Keep the resolved fallback error.
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    return undefined as TResponse;
  }

  return JSON.parse(responseText) as TResponse;
};

export const apiClient = {
  get: <TResponse>(
    endpoint: string
  ): Promise<TResponse> => {
    return request<TResponse>(endpoint);
  },

  post: <TResponse, TBody>(
    endpoint: string,
    body: TBody
  ): Promise<TResponse> => {
    return request<TResponse, TBody>(endpoint, {
      method: "POST",
      body
    });
  },

  patch: <TResponse, TBody>(
    endpoint: string,
    body: TBody
  ): Promise<TResponse> => {
    return request<TResponse, TBody>(endpoint, {
      method: "PATCH",
      body
    });
  },

  put: <TResponse, TBody>(
    endpoint: string,
    body: TBody
  ): Promise<TResponse> => {
    return request<TResponse, TBody>(endpoint, {
      method: "PUT",
      body
    });
  },

  delete: <TResponse>(
    endpoint: string
  ): Promise<TResponse> => {
    return request<TResponse>(endpoint, {
      method: "DELETE"
    });
  }
};