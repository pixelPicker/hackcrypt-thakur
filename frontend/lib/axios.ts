import axios from "axios";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60_000,
});
