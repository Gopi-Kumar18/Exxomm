const mongoose = require("mongoose");
const Cart = require("../../../backend/models/Cart");

describe("Cart model", () => {
  it("fails validation when required fields are missing", () => {
    const cart = new Cart({});
    const err = cart.validateSync();

    expect(err.errors.userId).toBeDefined();
    expect(err.errors.productId).toBeDefined();
    expect(err.errors.count).toBeDefined();
  });

  it("passes validation when all required fields are present", () => {
    const cart = new Cart({
      userId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      count: "2",
    });

    expect(cart.validateSync()).toBeUndefined();
  });
});
