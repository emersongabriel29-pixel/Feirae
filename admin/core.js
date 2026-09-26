export const ORDER_TRANSITIONS={
  pending_payment:["paid","canceled"],
  paid:["accepted","canceled","refunded"],
  accepted:["preparing","canceled"],
  preparing:["ready_for_pickup","canceled"],
  ready_for_pickup:["driver_assigned","canceled"],
  driver_assigned:["collected","canceled"],
  collected:["out_for_delivery"],
  out_for_delivery:["delivered"],
  delivered:["refunded"],
  canceled:["refunded"],
  refunded:[]
};

export function safeSearchTerm(value){
  return String(value||"")
    .trim()
    .replace(/[,*()]/g," ")
    .replace(/\s+/g," ")
    .trim()
    .slice(0,120);
}

export function isUuid(value){
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function canAccessPermission({isSuperadmin=false,permissions=[]},permission){
  if(!permission)return true;
  return Boolean(isSuperadmin)||new Set(permissions).has(permission);
}

export function nextOrderStatuses(status){
  return ORDER_TRANSITIONS[status]||[];
}
