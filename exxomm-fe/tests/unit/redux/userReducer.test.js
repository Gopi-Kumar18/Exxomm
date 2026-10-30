import { describe, expect, it } from "vitest";
import {
  USER_INITIAL_STATE,
  userReducer,
} from "../../../src/redux/reducers/userReducer";
import * as actionTypes from "../../../src/redux/constants/userContants";

describe("userReducer", () => {
  it("returns the initial state for an unknown action", () => {
    expect(userReducer(undefined, { type: "UNKNOWN" })).toEqual(
      USER_INITIAL_STATE,
    );
  });

  it("sets the logged in user details", () => {
    const payload = { isLogin: true, details: { email: "a@a.com" } };

    const state = userReducer(undefined, {
      type: actionTypes.SET_USER,
      payload,
    });

    expect(state).toEqual({ userInfo: payload });
  });

  it("resets to the initial state", () => {
    const state = userReducer(
      { userInfo: { isLogin: true, details: { email: "a@a.com" } } },
      { type: actionTypes.SET_INITIAL_STATE },
    );

    expect(state).toEqual(USER_INITIAL_STATE);
  });
});
