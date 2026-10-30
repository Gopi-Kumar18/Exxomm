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
import CartScreen from "../../../src/screens/CartScreen";

describe("CartScreen", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows the empty cart message once the login check resolves", async () => {
    Api.getRequest.mockResolvedValue({ statusCode: 200, data: "{}" });

    renderWithProviders(<CartScreen />, {
      preloadedState: { cart: { cartItems: [] } },
    });

    expect(screen.getByText("Loading.....")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument(),
    );
  });

  it("renders cart items and the subtotal", async () => {
    Api.getRequest.mockResolvedValue({ statusCode: 200, data: "{}" });

    renderWithProviders(<CartScreen />, {
      preloadedState: {
        cart: {
          cartItems: [
            {
              product: "p1",
              name: "PlayStation 5",
              imageUrl: "ps5.png",
              price: 100,
              countInStock: 5,
              qty: 2,
            },
          ],
        },
      },
    });

    await waitFor(() =>
      expect(screen.getByText("PlayStation 5")).toBeInTheDocument(),
    );
    expect(screen.getByText("₹200.00")).toBeInTheDocument();
  });

  it("removes an item when the delete button is clicked", async () => {
    Api.getRequest.mockResolvedValue({ statusCode: 200, data: "{}" });
    Api.DeleteRequest.mockResolvedValue({});

    renderWithProviders(<CartScreen />, {
      preloadedState: {
        cart: {
          cartItems: [
            {
              _id: "cart-1",
              product: "p1",
              name: "PlayStation 5",
              imageUrl: "ps5.png",
              price: 100,
              countInStock: 5,
              qty: 1,
            },
          ],
        },
      },
    });

    await waitFor(() =>
      expect(screen.getByText("PlayStation 5")).toBeInTheDocument(),
    );

    fireEvent.click(document.querySelector(".cartItem__deleteBtn"));

    await waitFor(() =>
      expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument(),
    );
    expect(Api.DeleteRequest).toHaveBeenCalledWith("/api/cart/cart-1");
  });
});
