import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Product from "../../../src/components/Product";

const renderProduct = props =>
  render(
    <MemoryRouter>
      <Product {...props} />
    </MemoryRouter>,
  );

describe("Product", () => {
  it("renders the product name, truncated description, price and link", () => {
    renderProduct({
      imageUrl: "ps5.png",
      description: "a".repeat(150),
      price: 499,
      name: "PlayStation 5",
      productId: "p1",
    });

    expect(screen.getByText("PlayStation 5")).toBeInTheDocument();
    expect(screen.getByText(`${"a".repeat(100)}...`)).toBeInTheDocument();
    expect(screen.getByText("₹499")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      "/product/p1",
    );
    expect(screen.getByRole("img")).toHaveAttribute("src", "ps5.png");
  });
});
