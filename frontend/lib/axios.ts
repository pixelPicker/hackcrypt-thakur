import axios from "axios";

export const apiBaseUrl = "http://localhost:8000";

export const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60_000,
});
