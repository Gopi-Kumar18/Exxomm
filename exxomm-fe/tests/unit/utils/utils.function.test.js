import { describe, expect, it } from "vitest";
import { convertToCartData } from "../../../src/utils/utils.function";

describe("convertToCartData", () => {
  it("maps populated cart documents into flat cart items", () => {
    const carts = [
      {
        _id: "cart-1",
        count: "2",
        productId: {
          _id: "product-1",
          name: "PS5",
          imageUrl: "ps5.png",
          price: 499,
          countInStock: 10,
        },
      },
    ];

    expect(convertToCartData(carts)).toEqual([
      {
        product: "product-1",
        name: "PS5",
        imageUrl: "ps5.png",
        price: 499,
        countInStock: 10,
        qty: "2",
        _id: "cart-1",
      },
    ]);
  });

  it("returns an empty array when given an empty cart", () => {
    expect(convertToCartData([])).toEqual([]);
  });
});
