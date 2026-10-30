import { afterEach, describe, expect, it } from "vitest";
import {
  getToken,
  isLogin,
  logout,
  setToken,
  token_key,
} from "../../../src/utils/localstorage";

describe("localstorage utils", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("stores and retrieves the auth token", () => {
    setToken("abc.def.ghi");

    expect(window.localStorage.getItem(token_key)).toBe("abc.def.ghi");
    expect(getToken()).toBe("abc.def.ghi");
  });

  it("returns false from getToken when there is no token", () => {
    expect(getToken()).toBe(false);
  });

  it("reports isLogin as true only when a token is present", () => {
    expect(isLogin()).toBe(false);

    setToken("abc.def.ghi");
    expect(isLogin()).toBe(true);
  });

  it("clears all stored data on logout", () => {
    setToken("abc.def.ghi");
    logout();

    expect(getToken()).toBe(false);
  });
});
