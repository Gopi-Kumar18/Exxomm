import { describe, expect, it } from "vitest";
import {
  getProductDetailsReducer,
  getProductsReducer,
} from "../../../src/redux/reducers/productReducers";
import * as actionTypes from "../../../src/redux/constants/productConstants";

describe("getProductsReducer", () => {
  it("returns the initial state for an unknown action", () => {
    expect(getProductsReducer(undefined, { type: "UNKNOWN" })).toEqual({
      products: [],
    });
  });

  it("sets loading on request", () => {
    const state = getProductsReducer(undefined, {
      type: actionTypes.GET_PRODUCTS_REQUEST,
    });

    expect(state).toEqual({ loading: true, products: [] });
  });

  it("stores the product list on success", () => {
    const products = [{ name: "PS5" }];
    const state = getProductsReducer(undefined, {
      type: actionTypes.GET_PRODUCTS_SUCCESS,
      payload: products,
    });

    expect(state).toEqual({ products, loading: false });
  });

  it("stores the error on failure", () => {
    const state = getProductsReducer(undefined, {
      type: actionTypes.GET_PRODUCTS_FAIL,
      payload: "boom",
    });

    expect(state).toEqual({ loading: false, error: "boom" });
  });
});

describe("getProductDetailsReducer", () => {
  it("returns the initial state for an unknown action", () => {
    expect(getProductDetailsReducer(undefined, { type: "UNKNOWN" })).toEqual({
      product: {},
    });
  });

  it("sets loading on request", () => {
    const state = getProductDetailsReducer(undefined, {
      type: actionTypes.GET_PRODUCT_DETAILS_REQUEST,
    });

    expect(state).toEqual({ loading: true });
  });

  it("stores the product details on success", () => {
    const product = { _id: "p1", name: "PS5" };
    const state = getProductDetailsReducer(undefined, {
      type: actionTypes.GET_PRODUCT_DETAILS_SUCCESS,
      payload: product,
    });

    expect(state).toEqual({ loading: false, product });
  });

  it("stores the error on failure", () => {
    const state = getProductDetailsReducer(undefined, {
      type: actionTypes.GET_PRODUCT_DETAILS_FAIL,
      payload: "boom",
    });

    expect(state).toEqual({ loading: false, error: "boom" });
  });

  it("resets the product details", () => {
    const state = getProductDetailsReducer(
      { loading: false, product: { _id: "p1" } },
      { type: actionTypes.GET_PRODUCT_DETAILS_RESET },
    );

    expect(state).toEqual({ product: {} });
  });
});
