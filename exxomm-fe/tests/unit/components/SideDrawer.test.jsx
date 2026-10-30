import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { setToken } from "../../../src/utils/localstorage";
import SideDrawer from "../../../src/components/SideDrawer";

describe("SideDrawer", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("adds the show class and renders the cart count when open", () => {
    const { container } = renderWithProviders(
      <SideDrawer show={true} click={vi.fn()} />,
      {
        preloadedState: {
          cart: { cartItems: [{ product: "p1", qty: 4 }] },
          user: { userInfo: { isLogin: false, details: {} } },
        },
      },
    );

    expect(container.querySelector(".sidedrawer.show")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("omits the show class when closed", () => {
    const { container } = renderWithProviders(
      <SideDrawer show={false} click={vi.fn()} />,
      {
        preloadedState: {
          cart: { cartItems: [] },
          user: { userInfo: { isLogin: false, details: {} } },
        },
      },
    );

    expect(container.querySelector(".sidedrawer.show")).not.toBeInTheDocument();
  });

  it("logs the user out when the logout link is clicked", () => {
    setToken("test-token");
    const { store } = renderWithProviders(
      <SideDrawer show={true} click={vi.fn()} />,
      {
        preloadedState: {
          cart: { cartItems: [] },
          user: { userInfo: { isLogin: true, details: { email: "a@a.com" } } },
        },
      },
    );

    fireEvent.click(screen.getByText("Logout"));

    expect(store.getState().user.userInfo.isLogin).toBe(false);
    expect(window.localStorage.getItem("E_COMMERCE_TOKEN")).toBeNull();
  });
});
