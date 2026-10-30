jest.mock("../../backend/models/Product");

const request = require("supertest");
const app = require("../../backend/app");
const Product = require("../../backend/models/Product");

describe("GET /api/products", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns the full product list", async () => {
    const products = [{ _id: "p1", name: "PS5" }];
    Product.find.mockResolvedValue(products);

    const res = await request(app).get("/api/products");

    expect(Product.find).toHaveBeenCalledWith({});
    expect(res.status).toBe(200);
    expect(res.body).toEqual(products);
  });

  it("returns 500 when the database call fails", async () => {
    Product.find.mockRejectedValue(new Error("db down"));

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server Error" });
  });
});

describe("GET /api/products/:id", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns the matching product", async () => {
    const product = { _id: "p1", name: "PS5" };
    Product.findById.mockResolvedValue(product);

    const res = await request(app).get("/api/products/p1");

    expect(Product.findById).toHaveBeenCalledWith("p1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(product);
  });

  it("returns 500 when the database call fails", async () => {
    Product.findById.mockRejectedValue(new Error("db down"));

    const res = await request(app).get("/api/products/p1");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server Error" });
  });
});
