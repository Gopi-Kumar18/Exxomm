import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { setToken } from "../../../src/utils/localstorage";
import Navbar from "../../../src/components/Navbar";

describe("Navbar", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("shows the total item count and a login link when logged out", () => {
    renderWithProviders(<Navbar click={vi.fn()} />, {
      preloadedState: {
        cart: { cartItems: [{ product: "p1", qty: 2 }, { product: "p2", qty: 1 }] },
        user: { userInfo: { isLogin: false, details: {} } },
      },
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/signin",
    );
  });

  it("shows a logout action and clears the session when logged in", () => {
    setToken("test-token");
    const { store } = renderWithProviders(<Navbar click={vi.fn()} />, {
      preloadedState: {
        cart: { cartItems: [] },
        user: { userInfo: { isLogin: true, details: { email: "a@a.com" } } },
      },
    });

    fireEvent.click(screen.getByText("Logout"));

    expect(store.getState().user.userInfo.isLogin).toBe(false);
    expect(window.localStorage.getItem("E_COMMERCE_TOKEN")).toBeNull();
  });

  it("invokes the click handler for the hamburger menu", () => {
    const click = vi.fn();
    const { container } = renderWithProviders(<Navbar click={click} />, {
      preloadedState: {
        cart: { cartItems: [] },
        user: { userInfo: { isLogin: false, details: {} } },
      },
    });

    fireEvent.click(container.querySelector(".hamburger__menu"));

    expect(click).toHaveBeenCalledTimes(1);
  });
});
