import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BASE = (process.env.NEXT_PUBLIC_API_URL as string) || "http://127.0.0.1:5055/api/v1";

async function request<T = any>(pathname: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let text = "";
    try { text = await res.text(); } catch {}
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T = any>(p: string) => request<T>(p, { method: "GET" }),
  post: <T = any>(p: string, body: unknown) => request<T>(p, { method: "POST", body: JSON.stringify(body) }),
  put: <T = any>(p: string, body: unknown) => request<T>(p, { method: "PUT", body: JSON.stringify(body) }),
};
