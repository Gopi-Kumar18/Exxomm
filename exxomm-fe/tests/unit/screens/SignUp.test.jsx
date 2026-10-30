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
import SignUp from "../../../src/screens/SignUp/index";

describe("SignUp", () => {
  afterEach(() => vi.clearAllMocks());

  it("submits the new account details", async () => {
    Api.postRequest.mockResolvedValue({
      statusCode: 201,
      data: "Sucessfully account opened ",
    });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Your full name.."), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your email.."), {
      target: { value: "jane@a.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your Password.."), {
      target: { value: "plain-password" },
    });
    fireEvent.click(screen.getByDisplayValue("Sign up"));

    await waitFor(() =>
      expect(Api.postRequest).toHaveBeenCalledWith("/api/user/signup", {
        email: "jane@a.com",
        fullName: "Jane Doe",
        password: "plain-password",
      }),
    );
    expect(alertSpy).toHaveBeenCalledWith("Sucessfully account opened ");
  });

  it("alerts the error message when the email is already registered", async () => {
    Api.postRequest.mockResolvedValue({
      statusCode: 400,
      data: "Email already in use",
    });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Your full name.."), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your email.."), {
      target: { value: "jane@a.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your Password.."), {
      target: { value: "plain-password" },
    });
    fireEvent.click(screen.getByDisplayValue("Sign up"));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Email already in use"),
    );
  });
});
