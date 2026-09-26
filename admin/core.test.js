import { describe, expect, it } from "vitest";
import { ORDER_TRANSITIONS, safeSearchTerm, isUuid, canAccessPermission, nextOrderStatuses } from "./core.js";

describe("Feiraê Gestão core",()=>{
  it("não concede permissão implícita a admin comum sem permissões",()=>{
    expect(canAccessPermission({isSuperadmin:false,permissions:[]},"finance.manage")).toBe(false);
    expect(canAccessPermission({isSuperadmin:true,permissions:[]},"finance.manage")).toBe(true);
  });

  it("aceita somente transições operacionais previstas",()=>{
    expect(nextOrderStatuses("preparing")).toEqual(["ready_for_pickup","canceled"]);
    expect(nextOrderStatuses("refunded")).toEqual([]);
    expect(ORDER_TRANSITIONS.out_for_delivery).toEqual(["delivered"]);
  });

  it("sanitiza busca e reconhece UUID",()=>{
    expect(safeSearchTerm("  João, (teste)*  ")).toBe("João teste");
    expect(isUuid("241c4016-9584-462a-b65c-68a446bfd38c")).toBe(true);
    expect(isUuid("João")).toBe(false);
  });
});
