"use client";

export function getClientUserId() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("fab_user_id="));

  if (!cookie) {
    return null;
  }

  const [, value] = cookie.split("=");
  return decodeURIComponent(value ?? "");
}
