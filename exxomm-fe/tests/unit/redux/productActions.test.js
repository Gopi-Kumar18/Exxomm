import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/utils/Api", () => ({
  Api: {
    getRequest: vi.fn(),
  },
}));

import { Api } from "../../../src/utils/Api";
import {
  getProductDetails,
  getProducts,
  removeProductDetails,
} from "../../../src/redux/actions/productActions";
import * as actionTypes from "../../../src/redux/constants/productConstants";

describe("getProducts", () => {
  afterEach(() => vi.clearAllMocks());

  it("dispatches request then success with the parsed product list", async () => {
    const products = [{ name: "PS5" }];
    Api.getRequest.mockResolvedValue({ data: JSON.stringify(products) });
    const dispatch = vi.fn();

    await getProducts()(dispatch);

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: actionTypes.GET_PRODUCTS_REQUEST,
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: actionTypes.GET_PRODUCTS_SUCCESS,
      payload: products,
    });
  });

  it("dispatches a failure action when the request throws", async () => {
    Api.getRequest.mockRejectedValue(new Error("network down"));
    const dispatch = vi.fn();

    await getProducts()(dispatch);

    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: actionTypes.GET_PRODUCTS_FAIL,
      payload: "network down",
    });
  });
});

describe("getProductDetails", () => {
  afterEach(() => vi.clearAllMocks());

  it("dispatches request then success with the parsed product", async () => {
    const product = { _id: "p1", name: "PS5" };
    Api.getRequest.mockResolvedValue({ data: JSON.stringify(product) });
    const dispatch = vi.fn();

    await getProductDetails("p1")(dispatch);

    expect(Api.getRequest).toHaveBeenCalledWith("/api/products/p1");
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: actionTypes.GET_PRODUCT_DETAILS_REQUEST,
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: actionTypes.GET_PRODUCT_DETAILS_SUCCESS,
      payload: { ...product },
    });
  });

  it("dispatches a failure action when the request throws", async () => {
    Api.getRequest.mockRejectedValue(new Error("network down"));
    const dispatch = vi.fn();

    await getProductDetails("p1")(dispatch);

    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: actionTypes.GET_PRODUCT_DETAILS_FAIL,
      payload: "network down",
    });
  });
});

describe("removeProductDetails", () => {
  it("dispatches a reset action", () => {
    const dispatch = vi.fn();

    removeProductDetails()(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: actionTypes.GET_PRODUCT_DETAILS_RESET,
    });
  });
});
