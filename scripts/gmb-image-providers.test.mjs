import { test, expect } from "bun:test";
import { generateGmbImageBytes, parseGeneratedImageBase64 } from "../supabase/functions/_shared/gmbImageProviders.ts";

const fakeJpeg = Uint8Array.from({ length: 6000 }, (_, i) => i < 3 ? [255,216,255][i] : 0);
const encoded = Buffer.from(fakeJpeg).toString("base64");

test("decodes and validates real image container headers", () => {
  const result = parseGeneratedImageBase64("data:image/jpeg;base64," + encoded, "cloudflare");
  expect(result.mime).toBe("image/jpeg");
  expect(result.extension).toBe("jpg");
  expect(result.bytes.length).toBe(6000);
  expect(() => parseGeneratedImageBase64("not an image", "cloudflare")).toThrow();
  expect(() => parseGeneratedImageBase64(Buffer.alloc(6000).toString("base64"), "cloudflare")).toThrow();
});

test("calls Cloudflare Workers AI first and accepts its JSON image result", async () => {
  const oldDeno = globalThis.Deno;
  const oldFetch = globalThis.fetch;
  let calls = [];
  globalThis.Deno = { env: { get: (key) =>
    ({ CLOUDFLARE_ACCOUNT_ID: "account-test", CLOUDFLARE_API_TOKEN: "token-test", OPENROUTER_API_KEY: "router-test" })[key] } };
  globalThis.fetch = async (url) => {
    calls.push(url);
    return Response.json({ success: true, result: { image: encoded } });
  };
  try {
    const result = await generateGmbImageBytes("A chair in a furniture showroom");
    expect(result.provider).toBe("cloudflare");
    expect(result.mime).toBe("image/jpeg");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("cloudflare.com");
  } finally {
    globalThis.Deno = oldDeno;
    globalThis.fetch = oldFetch;
  }
});

test("falls back to OpenRouter if Cloudflare returns 429", async () => {
  const oldDeno = globalThis.Deno;
  const oldFetch = globalThis.fetch;
  const called = [];
  globalThis.Deno = { env: { get: (key) =>
    ({ CLOUDFLARE_ACCOUNT_ID: "account-test", CLOUDFLARE_API_TOKEN: "token-test", OPENROUTER_API_KEY: "router-test" })[key] } };
  globalThis.fetch = async (url) => {
    called.push(url);
    if (String(url).includes("cloudflare")) return Response.json({ errors: [{ message: "rate limited" }] }, { status: 429 });
    return Response.json({ choices: [{ message: { images: [{ image_url: { url: "data:image/jpeg;base64," + encoded } }] } }] });
  };
  try {
    const result = await generateGmbImageBytes("A modern table");
    expect(result.provider).toBe("openrouter");
    expect(result.bytes.length).toBe(6000);
    expect(called).toHaveLength(2);
  } finally {
    globalThis.Deno = oldDeno;
    globalThis.fetch = oldFetch;
  }
});
