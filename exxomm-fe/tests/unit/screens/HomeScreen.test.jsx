import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";

vi.mock("../../../src/utils/Api", () => ({
  Api: {
    getRequest: vi.fn(),
    postRequest: vi.fn(),
    DeleteRequest: vi.fn(),
  },
}));

import { Api } from "../../../src/utils/Api";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import HomeScreen from "../../../src/screens/HomeScreen";

describe("HomeScreen", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders the fetched products", async () => {
    const products = [
      {
        _id: "p1",
        name: "PlayStation 5",
        description: "A game console",
        price: 499,
        imageUrl: "ps5.png",
      },
    ];
    Api.getRequest.mockImplementation(async path => {
      if (path === "/api/products") {
        return { data: JSON.stringify(products) };
      }
      return { statusCode: 400, data: "" };
    });

    renderWithProviders(<HomeScreen />);

    await waitFor(() =>
      expect(screen.getByText("PlayStation 5")).toBeInTheDocument(),
    );
  });

  it("renders the error message when the product fetch fails", async () => {
    Api.getRequest.mockImplementation(async path => {
      if (path === "/api/products") {
        throw new Error("network down");
      }
      return { statusCode: 400, data: "" };
    });

    renderWithProviders(<HomeScreen />);

    await waitFor(() =>
      expect(screen.getByText("network down")).toBeInTheDocument(),
    );
  });
});
