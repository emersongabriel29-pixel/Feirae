import { useEffect, useState } from "react";
import { fairs } from "../data";
import type { CustomerTab, Role, Screen } from "../types";
import { routeForRole } from "../domain/session";

function resetViewport() {
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function updateHash(route: string, replace = false) {
  const url = `${window.location.pathname}${window.location.search}#${route}`;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
}

export function useAppNavigation(role: Role | null, onNavigate?: () => void) {
  const [tab, setTab] = useState<CustomerTab>("home");
  const [screen, setScreen] = useState<Screen>("main");
  const [selectedFair, setSelectedFair] = useState(fairs[0].name);
  const [selectedVendor, setSelectedVendor] = useState("Sítio da Vó");

  useEffect(() => {
    resetViewport();
  }, [role, screen, tab]);

  useEffect(() => {
    if (!role) {
      if (window.location.hash !== "#/entrar") updateHash("/entrar", true);
      return;
    }

    function syncFromUrl() {
      const route = decodeURIComponent(window.location.hash.replace(/^#/, ""));

      if (role === "feirante") {
        setScreen(route === "/feirante/operacao" ? "feiranteOps" : "main");
        return;
      }

      if (role === "delivery") {
        setScreen(route === "/entregador/entregas" ? "deliveryOps" : "main");
        return;
      }

      const tabRoutes: Record<string, CustomerTab> = {
        "/cliente/inicio": "home",
        "/cliente/feiras": "fairs",
        "/cliente/produtos": "products",
        "/cliente/pedidos": "orders",
        "/cliente/perfil": "profile",
      };
      if (tabRoutes[route]) {
        setScreen("main");
        setTab(tabRoutes[route]);
        return;
      }

      const screenRoutes: Record<string, Screen> = {
        "/cliente/rastreamento": "tracking",
        "/cliente/checkout": "checkout",
        "/cliente/bancas": "vendors",
        "/cliente/favoritos": "favorites",
        "/cliente/notificacoes": "notifications",
        "/cliente/enderecos": "addresses",
        "/cliente/conta": "account",
        "/cliente/pagamentos": "payments",
        "/cliente/avaliacoes": "ratings",
        "/cliente/suporte": "chat",
        "/cliente/configuracoes": "settings",
      };
      if (screenRoutes[route]) {
        setScreen(screenRoutes[route]);
        return;
      }

      if (route.startsWith("/feiras/")) {
        const fairName = route.slice("/feiras/".length);
        if (fairs.some((fair) => fair.name === fairName)) setSelectedFair(fairName);
        setScreen("fair");
        return;
      }

      if (route.startsWith("/lojas/")) {
        setSelectedVendor(route.slice("/lojas/".length));
        setScreen("feirante");
        return;
      }

      setScreen("main");
      setTab("home");
      updateHash("/cliente/inicio", true);
    }

    if (!window.location.hash || window.location.hash === "#/entrar") {
      updateHash(routeForRole(role), true);
    }

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [role]);

  function openCustomerTab(nextTab: CustomerTab) {
    setScreen("main");
    setTab(nextTab);
    onNavigate?.();
    const routes: Record<CustomerTab, string> = {
      home: "/cliente/inicio",
      fairs: "/cliente/feiras",
      products: "/cliente/produtos",
      orders: "/cliente/pedidos",
      profile: "/cliente/perfil",
    };
    updateHash(routes[nextTab]);
  }

  function openScreen(nextScreen: Screen) {
    setScreen(nextScreen);
    onNavigate?.();
    const routes: Partial<Record<Screen, string>> = {
      tracking: "/cliente/rastreamento",
      checkout: "/cliente/checkout",
      vendors: "/cliente/bancas",
      favorites: "/cliente/favoritos",
      notifications: "/cliente/notificacoes",
      addresses: "/cliente/enderecos",
      account: "/cliente/conta",
      payments: "/cliente/pagamentos",
      ratings: "/cliente/avaliacoes",
      chat: "/cliente/suporte",
      settings: "/cliente/configuracoes",
      feiranteOps: "/feirante/operacao",
      deliveryOps: "/entregador/entregas",
    };
    if (nextScreen === "fair") updateHash(`/feiras/${encodeURIComponent(selectedFair)}`);
    else if (nextScreen === "feirante") updateHash(`/lojas/${encodeURIComponent(selectedVendor)}`);
    else if (routes[nextScreen]) updateHash(routes[nextScreen]);
  }

  function openFair(name: string) {
    setSelectedFair(name);
    setScreen("fair");
    onNavigate?.();
    updateHash(`/feiras/${encodeURIComponent(name)}`);
  }

  function openVendor(name: string) {
    setSelectedVendor(name);
    setScreen("feirante");
    onNavigate?.();
    updateHash(`/lojas/${encodeURIComponent(name)}`);
  }

  function resetForRole(nextRole: Role) {
    setScreen("main");
    setTab("home");
    onNavigate?.();
    updateHash(routeForRole(nextRole), true);
  }

  function resetForLogout() {
    setScreen("main");
    setTab("home");
    onNavigate?.();
    updateHash("/entrar", true);
  }

  function openRoleRoot(nextRole: Exclude<Role, "customer">) {
    setScreen("main");
    onNavigate?.();
    updateHash(nextRole === "feirante" ? "/feirante" : "/entregador");
  }

  return {
    tab,
    screen,
    selectedFair,
    selectedVendor,
    setTab,
    setScreen,
    setSelectedFair,
    setSelectedVendor,
    openCustomerTab,
    openScreen,
    openFair,
    openVendor,
    resetForRole,
    resetForLogout,
    openRoleRoot,
  };
}
