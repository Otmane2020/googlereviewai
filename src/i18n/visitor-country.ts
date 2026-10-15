import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Country comes from the hosting platform's trusted edge geolocation headers.
 * We never send a visitor's IP to third-party geolocation services or expose it.
 * Unknown country means "en"; only an explicit "FR" selects French by default.
 */
export const getVisitorCountry = createServerFn({ method: "GET" }).handler(async () => {
  const candidate = [
    getRequestHeader("x-vercel-ip-country"),
    getRequestHeader("cf-ipcountry"),
    getRequestHeader("cloudfront-viewer-country"),
    getRequestHeader("x-country-code"),
    getRequestHeader("x-nf-country-code"),
  ].find(value => /^[A-Za-z]{2}$/.test(value || ""));

  // No personal/IP details returned or stored, only the country if provided.
  return candidate?.toUpperCase() || null;
});
