import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import Backdrop from "../../../src/components/Backdrop";

describe("Backdrop", () => {
  it("renders nothing when show is false", () => {
    const { container } = render(<Backdrop show={false} click={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a clickable backdrop when show is true", () => {
    const click = vi.fn();
    const { container } = render(<Backdrop show={true} click={click} />);

    const backdrop = container.querySelector(".backdrop");
    expect(backdrop).toBeInTheDocument();

    fireEvent.click(backdrop);
    expect(click).toHaveBeenCalledTimes(1);
  });
});
