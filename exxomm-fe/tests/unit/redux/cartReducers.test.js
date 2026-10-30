import { describe, expect, it } from "vitest";
import { cartReducer } from "../../../src/redux/reducers/cartReducers";
import * as actionTypes from "../../../src/redux/constants/cartConstants";

describe("cartReducer", () => {
  it("returns the initial state for an unknown action", () => {
    expect(cartReducer(undefined, { type: "UNKNOWN" })).toEqual({
      cartItems: [],
    });
  });

  it("adds a new item to the cart", () => {
    const item = { product: "p1", name: "PS5", qty: 1 };
    const state = cartReducer(undefined, {
      type: actionTypes.ADD_TO_CART,
      payload: item,
    });

    expect(state.cartItems).toEqual([item]);
  });

  it("replaces an existing item for the same product", () => {
    const initial = { cartItems: [{ product: "p1", qty: 1 }] };
    const updated = { product: "p1", qty: 3 };

    const state = cartReducer(initial, {
      type: actionTypes.ADD_TO_CART,
      payload: updated,
    });

    expect(state.cartItems).toEqual([updated]);
  });

  it("removes an item by product id", () => {
    const initial = {
      cartItems: [{ product: "p1" }, { product: "p2" }],
    };

    const state = cartReducer(initial, {
      type: actionTypes.REMOVE_FROM_CART,
      payload: "p1",
    });

    expect(state.cartItems).toEqual([{ product: "p2" }]);
  });

  it("replaces the cart with fetched items", () => {
    const carts = [{ product: "p1" }, { product: "p2" }];

    const state = cartReducer(
      { cartItems: [{ product: "stale" }] },
      { type: actionTypes.FETCH_MY_CART, payload: { carts } },
    );

    expect(state.cartItems).toEqual(carts);
  });
});
