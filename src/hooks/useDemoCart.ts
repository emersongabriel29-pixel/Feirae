import { useMemo } from "react";
import { products } from "../data";
import { cartSubtotal } from "../utils";
import { usePersistentState } from "../usePersistentState";

export function useDemoCart(notify: (message: string) => void) {
  const [cart, setCart] = usePersistentState<Record<number, number>>("feirae:cart", {});

  const cartProducts = useMemo(() => products.filter((product) => cart[product.id]), [cart]);
  const subtotal = useMemo(() => cartSubtotal(cartProducts, cart), [cartProducts, cart]);
  const itemCount = useMemo(() => Object.values(cart).reduce((sum, quantity) => sum + quantity, 0), [cart]);
  const cartFairName = cartProducts[0]?.fair ?? "";

  function addToCart(id: number) {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    setCart((current) => {
      const currentProduct = products.find((item) => current[item.id]);
      if (currentProduct && currentProduct.fair !== product.fair) {
        notify(
          `Sua sacola é da ${currentProduct.fair}. Finalize ou esvazie a sacola antes de comprar na ${product.fair}.`,
        );
        return current;
      }

      const quantity = current[id] ?? 0;
      if (quantity >= product.stock) {
        notify("Você atingiu o estoque disponível deste produto.");
        return current;
      }
      return { ...current, [id]: quantity + 1 };
    });
  }

  function removeFromCart(id: number, removeAll = false) {
    setCart((current) => {
      const next = { ...current };
      if (removeAll || next[id] === 1) delete next[id];
      else if (next[id]) next[id] -= 1;
      return next;
    });
  }

  function restoreDemoBasket() {
    const demoBasket: Record<number, number> = {
      1: 1,
      2: 1,
      9: 2,
    };
    setCart((current) => ({ ...current, ...demoBasket }));
  }

  return {
    cart,
    setCart,
    cartProducts,
    subtotal,
    itemCount,
    cartFairName,
    addToCart,
    removeFromCart,
    restoreDemoBasket,
  };
}
