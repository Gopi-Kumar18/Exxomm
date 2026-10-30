const Product = require("../../../backend/models/Product");

describe("Product model", () => {
  it("fails validation when required fields are missing", () => {
    const product = new Product({});
    const err = product.validateSync();

    expect(err.errors.name).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.price).toBeDefined();
    expect(err.errors.countInStock).toBeDefined();
    expect(err.errors.imageUrl).toBeDefined();
  });

  it("passes validation when all required fields are present", () => {
    const product = new Product({
      name: "PlayStation 5",
      description: "A game console",
      price: 499,
      countInStock: 15,
      imageUrl: "https://example.com/ps5.png",
    });

    expect(product.validateSync()).toBeUndefined();
  });
});
