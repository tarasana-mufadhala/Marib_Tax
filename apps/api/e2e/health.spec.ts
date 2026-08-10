import { test, expect } from "@playwright/test";

test("health endpoint returns ok", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toEqual({
    status: "ok",
    service: "marib-tax-api",
    version: "v1",
  });
});

test("readiness endpoint returns ready", async ({ request }) => {
  const response = await request.get("/ready");
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toEqual({
    status: "ready",
    service: "marib-tax-api",
    version: "v1",
  });
});

test("404 returns structured error envelope", async ({ request }) => {
  const response = await request.get("/missing-route");
  expect(response.status()).toBe(404);

  const body = await response.json();
  expect(body).toHaveProperty("error");
  expect(body.error).toHaveProperty("code");
  expect(body.error).toHaveProperty("message");
  expect(body.error).toHaveProperty("traceId");
});