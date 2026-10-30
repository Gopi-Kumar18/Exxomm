import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../src/utils/Api", () => ({
  Api: {
    getRequest: vi.fn(),
    postRequest: vi.fn(),
    DeleteRequest: vi.fn(),
  },
}));

import { Api } from "../../../src/utils/Api";
import { getToken } from "../../../src/utils/localstorage";
import SignIn from "../../../src/screens/SignIn/index";

describe("SignIn", () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("stores the token on a successful sign in", async () => {
    Api.postRequest.mockResolvedValue({
      statusCode: 200,
      data: JSON.stringify({ status: "ok", token: "signed-jwt" }),
    });

    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Your email.."), {
      target: { value: "a@a.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your Password.."), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByDisplayValue("Sign in"));

    await waitFor(() => expect(getToken()).toBe("signed-jwt"));
    expect(Api.postRequest).toHaveBeenCalledWith("/api/user/signin", {
      email: "a@a.com",
      password: "correct-password",
    });
  });

  it("alerts the error message when sign in fails", async () => {
    Api.postRequest.mockResolvedValue({
      statusCode: 400,
      data: "InValid password !",
    });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Your email.."), {
      target: { value: "a@a.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your Password.."), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByDisplayValue("Sign in"));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("InValid password !"),
    );
    expect(getToken()).toBe(false);
  });
});
