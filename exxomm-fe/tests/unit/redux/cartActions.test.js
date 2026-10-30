import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/utils/Api", () => ({
  Api: {
    getRequest: vi.fn(),
    postRequest: vi.fn(),
    DeleteRequest: vi.fn(),
  },
}));

import { Api } from "../../../src/utils/Api";
import {
  addToCart,
  fetchCart,
  removeFromCart,
} from "../../../src/redux/actions/cartActions";
import * as actionTypes from "../../../src/redux/constants/cartConstants";

describe("addToCart", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches the product, dispatches ADD_TO_CART and persists the cart item", async () => {
    const product = {
      _id: "p1",
      name: "PS5",
      imageUrl: "ps5.png",
      price: 499,
      countInStock: 10,
    };
    Api.getRequest.mockResolvedValue({ data: JSON.stringify(product) });
    Api.postRequest.mockResolvedValue({});
    const dispatch = vi.fn();

    await addToCart("p1", 2)(dispatch);

    expect(Api.getRequest).toHaveBeenCalledWith("/api/products/p1");
    expect(dispatch).toHaveBeenCalledWith({
      type: actionTypes.ADD_TO_CART,
      payload: {
        product: "p1",
        name: "PS5",
        imageUrl: "ps5.png",
        price: 499,
        countInStock: 10,
        qty: 2,
      },
    });
    expect(Api.postRequest).toHaveBeenCalledWith("/api/cart", {
      productId: "p1",
      count: 2,
    });
  });
});

describe("removeFromCart", () => {
  afterEach(() => vi.clearAllMocks());

  it("dispatches REMOVE_FROM_CART and deletes the cart item", () => {
    const dispatch = vi.fn();

    removeFromCart({ pId: "p1", _id: "cart-1" })(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: actionTypes.REMOVE_FROM_CART,
      payload: "p1",
    });
    expect(Api.DeleteRequest).toHaveBeenCalledWith("/api/cart/cart-1");
  });
});

describe("fetchCart", () => {
  afterEach(() => vi.clearAllMocks());

  it("dispatches FETCH_MY_CART with the converted cart items", async () => {
    const carts = [
      {
        _id: "cart-1",
        count: "2",
        productId: {
          _id: "p1",
          name: "PS5",
          imageUrl: "ps5.png",
          price: 499,
          countInStock: 10,
        },
      },
    ];
    Api.getRequest.mockResolvedValue({ data: JSON.stringify({ carts }) });
    const dispatch = vi.fn();

    await fetchCart()(dispatch);

    expect(Api.getRequest).toHaveBeenCalledWith("/api/cart/");
    expect(dispatch).toHaveBeenCalledWith({
      type: actionTypes.FETCH_MY_CART,
      payload: {
        carts: [
          {
            product: "p1",
            name: "PS5",
            imageUrl: "ps5.png",
            price: 499,
            countInStock: 10,
            qty: "2",
            _id: "cart-1",
          },
        ],
      },
    });
  });

  it("does not dispatch when the request fails", async () => {
    Api.getRequest.mockRejectedValue(new Error("network down"));
    const dispatch = vi.fn();

    await fetchCart()(dispatch);

    expect(dispatch).not.toHaveBeenCalled();
  });
});
