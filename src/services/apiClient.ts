import type { ApiRequestOptions } from "../types/api";

export const API_BASE_URL = "http://localhost:4000";

const buildHeaders = (headers?: HeadersInit): HeadersInit => {
  return {
    "Content-Type": "application/json",
    ...headers
  };
};

const request = async <TResponse, TBody = unknown>(
  endpoint: string,
  options: ApiRequestOptions<TBody> = {}
): Promise<TResponse> => {
  const { method = "GET", body, headers } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: buildHeaders(headers),
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    let errorMessage = "Something went wrong while processing the request.";

    try {
      const errorResponse = (await response.json()) as { message?: string };
      errorMessage = errorResponse.message ?? errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
};

export const apiClient = {
  get: <TResponse>(endpoint: string): Promise<TResponse> => {
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

  delete: <TResponse>(endpoint: string): Promise<TResponse> => {
    return request<TResponse>(endpoint, {
      method: "DELETE"
    });
  }
};