jest.mock("../../backend/models/User");
jest.mock("../../backend/models/Cart");

const request = require("supertest");
const app = require("../../backend/app");
const User = require("../../backend/models/User");
const Cart = require("../../backend/models/Cart");
const { newToken } = require("../../backend/utils/utility.function");

const authedUser = { _id: "user-1", email: "a@a.com" };

const withAuth = req => {
  User.findById.mockResolvedValue(authedUser);
  const token = newToken({ _id: "user-1" });
  return req.set("Authorization", `Bearer ${token}`);
};

afterEach(() => jest.clearAllMocks());

describe("GET /api/cart", () => {
  it("responds with an empty cart when not authenticated", async () => {
    const res = await request(app).get("/api/cart");

    expect(Cart.find).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", carts: [] });
  });

  it("responds with the user's cart when authenticated", async () => {
    const carts = [{ _id: "cart-1", productId: { name: "PS5" } }];
    const populate = jest.fn().mockResolvedValue(carts);
    Cart.find.mockReturnValue({ populate });

    const res = await withAuth(request(app).get("/api/cart"));

    expect(Cart.find).toHaveBeenCalledWith({ userId: "user-1" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", carts });
  });
});

describe("POST /api/cart", () => {
  it("responds with 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/cart")
      .send({ productId: "p1", count: 1 });

    expect(Cart.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });

  it("upserts the cart item when authenticated", async () => {
    const cart = { _id: "cart-1", productId: "p1", count: 1 };
    Cart.findOneAndUpdate.mockResolvedValue(cart);

    const res = await withAuth(
      request(app).post("/api/cart").send({ productId: "p1", count: 1 }),
    );

    expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
      { productId: "p1", userId: "user-1" },
      { productId: "p1", count: 1, userId: "user-1" },
      { upsert: true, new: true },
    );
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ status: "ok", cart });
  });
});

describe("DELETE /api/cart/:id", () => {
  it("responds with 401 when not authenticated", async () => {
    const res = await request(app).delete("/api/cart/cart-1");

    expect(Cart.findByIdAndRemove).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });

  it("responds with 404 when the cart item does not exist", async () => {
    Cart.findByIdAndRemove.mockResolvedValue(null);

    const res = await withAuth(request(app).delete("/api/cart/cart-1"));

    expect(res.status).toBe(404);
  });

  it("removes the cart item when authenticated", async () => {
    Cart.findByIdAndRemove.mockResolvedValue({ _id: "cart-1" });

    const res = await withAuth(request(app).delete("/api/cart/cart-1"));

    expect(Cart.findByIdAndRemove).toHaveBeenCalledWith(
      "cart-1",
      { _id: "cart-1", userId: "user-1" },
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
