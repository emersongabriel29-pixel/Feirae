import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeliveryContactCard } from "./CustomerScreens";

describe("DeliveryContactCard", () => {
  it("does not render contact details when no driver is assigned", () => {
    const { container } = render(<DeliveryContactCard orderId="order-test" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the assigned driver's contact details", () => {
    render(
      <DeliveryContactCard
        orderId="order-test"
        driver={{ name: "Entregador de teste", phone: "+55 61 99999-0000", vehicle: "Moto", plateMasked: "***-0000" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Entregador de teste" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ligar" })).toHaveAttribute("href", "tel:+5561999990000");
  });
});
