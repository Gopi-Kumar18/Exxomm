import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CartItem from "../../../src/components/CartItem";

const item = {
  product: "p1",
  name: "PlayStation 5",
  imageUrl: "ps5.png",
  price: 499,
  countInStock: 3,
  qty: 1,
};

describe("CartItem", () => {
  it("renders the item details and quantity options", () => {
    render(
      <MemoryRouter>
        <CartItem item={item} qtyChangeHandler={vi.fn()} removeHandler={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("PlayStation 5")).toBeInTheDocument();
    expect(screen.getByText("₹499")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("calls qtyChangeHandler with the product id and new quantity", () => {
    const qtyChangeHandler = vi.fn();
    render(
      <MemoryRouter>
        <CartItem item={item} qtyChangeHandler={qtyChangeHandler} removeHandler={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });

    expect(qtyChangeHandler).toHaveBeenCalledWith("p1", "2");
  });

  it("calls removeHandler with the product id", () => {
    const removeHandler = vi.fn();
    render(
      <MemoryRouter>
        <CartItem item={item} qtyChangeHandler={vi.fn()} removeHandler={removeHandler} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(removeHandler).toHaveBeenCalledWith("p1");
  });
});
