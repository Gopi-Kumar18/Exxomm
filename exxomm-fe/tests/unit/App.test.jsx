import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";

vi.mock("../../src/utils/Api", () => ({
  Api: {
    getRequest: vi.fn(),
    postRequest: vi.fn(),
    DeleteRequest: vi.fn(),
  },
}));

import { Api } from "../../src/utils/Api";
import { makeTestStore } from "../helpers/renderWithProviders";
import App from "../../src/App";

describe("App", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders the home screen with the navbar by default", async () => {
    Api.getRequest.mockResolvedValue({ statusCode: 400, data: "" });

    render(
      <Provider store={makeTestStore({ cart: { cartItems: [] } })}>
        <App />
      </Provider>,
    );

    expect(screen.getByText("Exxomm")).toBeInTheDocument();
    expect(screen.getByText("Latest Products")).toBeInTheDocument();

    await waitFor(() => expect(Api.getRequest).toHaveBeenCalled());
  });
});
