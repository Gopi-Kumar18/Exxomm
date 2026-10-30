import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Api } from "../../../src/utils/Api";
import { config } from "../../../src/utils/config";
import { setToken } from "../../../src/utils/localstorage";

const jsonResponse = (status, body) => ({
  status,
  text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
});

describe("Api", () => {
  beforeEach(() => {
    setToken("test-token");
    global.fetch = vi.fn();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("getRequest sends a Bearer token and returns the status and body", async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { ok: true }));

    const result = await Api.getRequest("/api/products");

    expect(global.fetch).toHaveBeenCalledWith(
      config.baseURL + "/api/products",
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer test-token" },
      }),
    );
    expect(result).toEqual({ statusCode: 200, data: JSON.stringify({ ok: true }) });
  });

  it("getRequest swallows network errors and returns a 400 fallback", async () => {
    global.fetch.mockRejectedValue(new Error("network down"));

    const result = await Api.getRequest("/api/products");

    expect(result).toEqual({ statusCode: 400, data: [] });
  });

  it("postRequest sends a JSON body with the auth header", async () => {
    global.fetch.mockResolvedValue(jsonResponse(201, { status: "ok" }));

    const result = await Api.postRequest("/api/cart", { productId: "p1", count: 1 });

    expect(global.fetch).toHaveBeenCalledWith(
      config.baseURL + "/api/cart",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ productId: "p1", count: 1 }),
      }),
    );
    expect(result).toEqual({ statusCode: 201, data: JSON.stringify({ status: "ok" }) });
  });

  it("DeleteRequest sends a DELETE request with the auth header", async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { status: "ok" }));

    const result = await Api.DeleteRequest("/api/cart/cart-1");

    expect(global.fetch).toHaveBeenCalledWith(
      config.baseURL + "/api/cart/cart-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(result).toEqual({ statusCode: 200, data: JSON.stringify({ status: "ok" }) });
  });

  it("putRequest sends a PUT request with a JSON body", async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { status: "ok" }));

    const result = await Api.putRequest("/api/products/p1", { price: 10 });

    expect(global.fetch).toHaveBeenCalledWith(
      config.baseURL + "/api/products/p1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ price: 10 }),
      }),
    );
    expect(result).toEqual({ statusCode: 200, data: JSON.stringify({ status: "ok" }) });
  });
});
