jest.mock("../../../backend/models/Product");

const Product = require("../../../backend/models/Product");
const {
  getProducts,
  getProductById,
} = require("../../../backend/controller/productControllers");
const { mockRequest, mockResponse } = require("../../helpers/mockExpress");

describe("getProducts", () => {
  afterEach(() => jest.clearAllMocks());

  it("responds with the list of products", async () => {
    const products = [{ name: "PS5" }, { name: "iPhone 12" }];
    Product.find.mockResolvedValue(products);

    const req = mockRequest();
    const res = mockResponse();
    await getProducts(req, res);

    expect(Product.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(products);
  });

  it("responds with 500 when the database call fails", async () => {
    Product.find.mockRejectedValue(new Error("db down"));

    const req = mockRequest();
    const res = mockResponse();
    await getProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server Error" });
  });
});

describe("getProductById", () => {
  afterEach(() => jest.clearAllMocks());

  it("responds with the matching product", async () => {
    const product = { _id: "abc123", name: "PS5" };
    Product.findById.mockResolvedValue(product);

    const req = mockRequest({ params: { id: "abc123" } });
    const res = mockResponse();
    await getProductById(req, res);

    expect(Product.findById).toHaveBeenCalledWith("abc123");
    expect(res.json).toHaveBeenCalledWith(product);
  });

  it("responds with 500 when the database call fails", async () => {
    Product.findById.mockRejectedValue(new Error("db down"));

    const req = mockRequest({ params: { id: "abc123" } });
    const res = mockResponse();
    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Server Error" });
  });
});
