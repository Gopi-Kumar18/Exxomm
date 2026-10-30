import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/utils/Api", () => ({
  Api: {
    getRequest: vi.fn(),
  },
}));

import { Api } from "../../../src/utils/Api";
import {
  setInitialState,
  setUserDeatils,
} from "../../../src/redux/actions/userAction";
import * as actionTypes from "../../../src/redux/constants/userContants";

describe("setUserDeatils", () => {
  afterEach(() => vi.clearAllMocks());

  it("dispatches SET_USER when the current user can be fetched", async () => {
    const user = { _id: "user-1", email: "a@a.com" };
    Api.getRequest.mockResolvedValue({
      statusCode: 200,
      data: JSON.stringify({ user }),
    });
    const dispatch = vi.fn();

    await setUserDeatils()(dispatch);

    expect(Api.getRequest).toHaveBeenCalledWith("/api/user/me");
    expect(dispatch).toHaveBeenCalledWith({
      type: actionTypes.SET_USER,
      payload: { isLogin: true, details: { ...user } },
    });
  });

  it("dispatches SET_INITIAL_STATE when the request is unauthorized", async () => {
    Api.getRequest.mockResolvedValue({ statusCode: 400, data: "" });
    const dispatch = vi.fn();

    await setUserDeatils()(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: actionTypes.SET_INITIAL_STATE,
    });
  });

  it("dispatches SET_INITIAL_STATE on a server error", async () => {
    Api.getRequest.mockResolvedValue({ statusCode: 500, data: "" });
    const dispatch = vi.fn();

    await setUserDeatils()(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: actionTypes.SET_INITIAL_STATE,
    });
  });
});

describe("setInitialState", () => {
  it("dispatches SET_INITIAL_STATE", async () => {
    const dispatch = vi.fn();

    await setInitialState()(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: actionTypes.SET_INITIAL_STATE,
    });
  });
});
