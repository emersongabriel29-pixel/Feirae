import { useMemo } from "react";
import { products } from "../data";
import { cartSubtotal } from "../utils";
import { usePersistentState } from "../usePersistentState";
import { marketplaceProducts } from "../domain/marketplaceBridge";
import { scopedStorageKey } from "../domain/storage";

export function useDemoCart(notify: (message: string) => void) {
  const catalog = marketplaceProducts(products);
  const [cart, setCart] = usePersistentState<Record<number, number>>(scopedStorageKey("feirae:cart"), {});

  const cartProducts = useMemo(() => catalog.filter((product) => cart[product.id]), [cart, catalog]);
  const subtotal = useMemo(() => cartSubtotal(cartProducts, cart), [cartProducts, cart]);
  const itemCount = useMemo(() => Object.values(cart).reduce((sum, quantity) => sum + quantity, 0), [cart]);
  const cartFairName = cartProducts[0]?.fair ?? "";

  function addToCart(id: number) {
    const product = catalog.find((item) => item.id === id);
    if (!product) return;

    setCart((current) => {
      const currentProduct = catalog.find((item) => current[item.id]);
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

  function restoreDemoBasket(items: Array<{ productId: number; quantity: number }> = []) {
    const restored = items.reduce<Record<number, number>>((next, item) => {
      const product = catalog.find((candidate) => candidate.id === item.productId);
      if (product?.stock) next[item.productId] = Math.min(item.quantity, product.stock);
      return next;
    }, {});
    if (Object.keys(restored).length) setCart(restored);
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
