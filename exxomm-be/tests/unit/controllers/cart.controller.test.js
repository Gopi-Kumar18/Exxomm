jest.mock("../../../backend/models/Cart");

const Cart = require("../../../backend/models/Cart");
const {
  addProductInCart,
  deleteProductInCart,
  getCartProducts,
} = require("../../../backend/controller/cart.controller");
const { mockRequest, mockResponse } = require("../../helpers/mockExpress");

describe("getCartProducts", () => {
  afterEach(() => jest.clearAllMocks());

  it("responds with an empty cart when there is no logged in user", async () => {
    const req = mockRequest({ user: null });
    const res = mockResponse();

    await getCartProducts(req, res);

    expect(Cart.find).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ status: "ok", carts: [] });
  });

  it("responds with the populated cart for a logged in user", async () => {
    const carts = [{ _id: "cart-1", productId: { name: "PS5" } }];
    const populate = jest.fn().mockResolvedValue(carts);
    Cart.find.mockReturnValue({ populate });

    const req = mockRequest({ user: { _id: "user-1" } });
    const res = mockResponse();

    await getCartProducts(req, res);

    expect(Cart.find).toHaveBeenCalledWith({ userId: "user-1" });
    expect(populate).toHaveBeenCalledWith("productId");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ status: "ok", carts });
  });

  it("responds with 500 when the database call fails", async () => {
    const populate = jest.fn().mockRejectedValue(new Error("db down"));
    Cart.find.mockReturnValue({ populate });

    const req = mockRequest({ user: { _id: "user-1" } });
    const res = mockResponse();

    await getCartProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("addProductInCart", () => {
  afterEach(() => jest.clearAllMocks());

  it("responds with 401 when there is no logged in user", async () => {
    const req = mockRequest({ user: null, body: { productId: "p1", count: 2 } });
    const res = mockResponse();

    await addProductInCart(req, res);

    expect(Cart.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      "Unauthorized, please log in to add to cart",
    );
  });

  it("upserts the cart item and responds with 201", async () => {
    const cart = { _id: "cart-1", productId: "p1", count: 2 };
    Cart.findOneAndUpdate.mockResolvedValue(cart);

    const req = mockRequest({
      user: { _id: "user-1" },
      body: { productId: "p1", count: 2 },
    });
    const res = mockResponse();

    await addProductInCart(req, res);

    expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
      { productId: "p1", userId: "user-1" },
      { productId: "p1", count: 2, userId: "user-1" },
      { upsert: true, new: true },
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({ status: "ok", cart });
  });

  it("responds with 500 when the database call fails", async () => {
    Cart.findOneAndUpdate.mockRejectedValue(new Error("db down"));

    const req = mockRequest({
      user: { _id: "user-1" },
      body: { productId: "p1", count: 2 },
    });
    const res = mockResponse();

    await addProductInCart(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("deleteProductInCart", () => {
  afterEach(() => jest.clearAllMocks());

  it("responds with 401 when there is no logged in user", async () => {
    const req = mockRequest({ user: null, params: { id: "cart-1" } });
    const res = mockResponse();

    await deleteProductInCart(req, res);

    expect(Cart.findByIdAndRemove).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith("Unauthorized");
  });

  it("responds with 404 when the cart item does not exist", async () => {
    Cart.findByIdAndRemove.mockResolvedValue(null);

    const req = mockRequest({
      user: { _id: "user-1" },
      params: { id: "cart-1" },
    });
    const res = mockResponse();

    await deleteProductInCart(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Cart item not found");
  });

  it("responds with 200 when the cart item is removed", async () => {
    Cart.findByIdAndRemove.mockResolvedValue({ _id: "cart-1" });

    const req = mockRequest({
      user: { _id: "user-1" },
      params: { id: "cart-1" },
    });
    const res = mockResponse();

    await deleteProductInCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ status: "ok" });
  });

  it("responds with 500 when the database call fails", async () => {
    Cart.findByIdAndRemove.mockRejectedValue(new Error("db down"));

    const req = mockRequest({
      user: { _id: "user-1" },
      params: { id: "cart-1" },
    });
    const res = mockResponse();

    await deleteProductInCart(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
