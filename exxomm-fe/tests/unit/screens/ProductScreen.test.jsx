import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

vi.mock("../../../src/utils/Api", () => ({
  Api: {
    getRequest: vi.fn(),
    postRequest: vi.fn(),
    DeleteRequest: vi.fn(),
  },
}));

import { Api } from "../../../src/utils/Api";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import ProductScreen from "../../../src/screens/ProductScreen";

const product = {
  _id: "p1",
  name: "PlayStation 5",
  description: "A game console",
  price: 499,
  countInStock: 5,
  imageUrl: "ps5.png",
};

describe("ProductScreen", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches and renders the product details", async () => {
    Api.getRequest.mockResolvedValue({ data: JSON.stringify(product) });

    renderWithProviders(
      <ProductScreen match={{ params: { id: "p1" } }} history={{ push: vi.fn() }} />,
    );

    await waitFor(() =>
      expect(screen.getByText("PlayStation 5")).toBeInTheDocument(),
    );
    expect(screen.getByText("In Stock")).toBeInTheDocument();
  });

  it("adds the product to the cart and redirects when logged in", async () => {
    Api.getRequest.mockImplementation(async path => {
      if (path === `/api/products/p1`) {
        return { data: JSON.stringify(product) };
      }
      return { data: JSON.stringify(product) };
    });
    Api.postRequest.mockResolvedValue({});
    const push = vi.fn();

    renderWithProviders(
      <ProductScreen match={{ params: { id: "p1" } }} history={{ push }} />,
      {
        preloadedState: {
          user: { userInfo: { isLogin: true, details: { email: "a@a.com" } } },
        },
      },
    );

    await waitFor(() =>
      expect(screen.getByText("PlayStation 5")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Add To Cart" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/cart"));
  });

  it("alerts instead of adding to cart when logged out", async () => {
    Api.getRequest.mockResolvedValue({ data: JSON.stringify(product) });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const push = vi.fn();

    renderWithProviders(
      <ProductScreen match={{ params: { id: "p1" } }} history={{ push }} />,
      {
        preloadedState: {
          user: { userInfo: { isLogin: false, details: {} } },
        },
      },
    );

    await waitFor(() =>
      expect(screen.getByText("PlayStation 5")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Add To Cart" }));

    expect(alertSpy).toHaveBeenCalledWith("You need to first login.");
    expect(push).not.toHaveBeenCalled();
  });
});
