import { useMemo } from "react";
import { products } from "../data";
import { cartSubtotal } from "../utils";
import { usePersistentState } from "../usePersistentState";
import { marketplaceProducts } from "../domain/marketplaceBridge";
import { scopedStorageKey } from "../domain/storage";
import { MAX_VENDORS_PER_ORDER, validateMultiVendorCart } from "../domain/multiVendor";

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
      const currentProducts = catalog.filter((item) => current[item.id]);
      const currentProduct = currentProducts[0];
      const decision = validateMultiVendorCart({
        currentFairName: currentProduct?.fair,
        currentVendorNames: currentProducts.map((item) => item.feirante),
        nextFairName: product.fair,
        nextVendorName: product.feirante,
      });
      if (!decision.allowed) {
        notify(decision.message);
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
    const restored: Record<number, number> = {};
    let fairName = "";
    const vendors = new Set<string>();

    for (const item of items) {
      const product = catalog.find((candidate) => candidate.id === item.productId);
      if (!product?.stock) continue;
      if (!fairName) fairName = product.fair;
      if (product.fair !== fairName) continue;
      if (!vendors.has(product.feirante) && vendors.size >= MAX_VENDORS_PER_ORDER) continue;
      vendors.add(product.feirante);
      restored[item.productId] = Math.min(item.quantity, product.stock);
    }

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
