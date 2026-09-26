import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { navGroups, modules } from "./modules.js";

const CONFIG_KEY="feirae:management:supabase";
const $=(s)=>document.querySelector(s);
const state={
 supabase:null,session:null,profile:null,active:"dashboard",rows:[],editing:null,
 permissions:new Set(),isSuperadmin:false,selected:new Set(),
 page:0,pageSize:50,total:0,query:"",mfaFactorId:null
};

const permissionByModule={
  alerts:"operations.manage",orders:"operations.manage",delivery_jobs:"operations.manage",support:"operations.manage",
  documents:"documents.review",enforcements:"accounts.enforce",
  states:"registrations.manage",fairs:"registrations.manage",stalls:"registrations.manage",users:"registrations.manage",vendors:"registrations.manage",
  drivers:"registrations.manage",products:"registrations.manage",categories:"registrations.manage",regions:"registrations.manage",
  vehicle_rules:"rules.manage",delivery_fees:"rules.manage",platform_fees:"rules.manage",payment_methods:"rules.manage",
  cancellation_reasons:"rules.manage",onboarding_requirements:"rules.manage",
  finance:"finance.manage",payments:"finance.manage",promotions:"finance.manage",payouts:"finance.manage",reviews:"finance.manage",
  content:"communications.manage",announcements:"communications.manage",notifications:"communications.manage",
  settings:"settings.manage",features:"settings.manage",integrations:"settings.manage",integration_health:"settings.manage",privacy:"settings.manage",
  admins:"permissions.manage",permissions:"permissions.manage",audit:"audit.view",reports:"reports.view"
};
function canModule(id){
  const permission=permissionByModule[id];
  return !permission||state.isSuperadmin||state.permissions.has("*")||state.permissions.has(permission);
}

function show(id){["boot","setupView","loginView","mfaView","appView"].forEach((x)=>$("#"+x).classList.toggle("hidden",x!==id));}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.remove("hidden");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add("hidden"),3000);}
function loginError(msg){$("#loginError").textContent=msg;$("#loginError").classList.toggle("hidden",!msg);}
function title(v){return String(v).replace(/(^|\s)\S/g,(m)=>m.toUpperCase());}
function money(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):esc(v);}
function date(v){if(!v)return "—";const d=new Date(v);return Number.isNaN(d.getTime())?esc(v):d.toLocaleString("pt-BR");}

function updateManagementClock(){
 const el=$("#managementClock");
 if(!el)return;
 const now=new Date();
 const dateText=new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(now);
 const timeText=new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit",hour12:false}).format(now);
 el.textContent=dateText+" - "+timeText;
}
updateManagementClock();
setInterval(updateManagementClock,30000);

const labels={
 id:"ID",name:"Nome",address:"Endereço",is_active:"Ativa",opening_hours:"Horários",full_name:"Nome",phone:"Telefone",
 role:"Papel",created_at:"Criado em",updated_at:"Atualizado",business_name:"Banca",approved:"Aprovado",description:"Descrição",
 city:"Cidade",state:"UF",receiving_method:"Recebimento",profile_id:"Usuário",document_type:"Documento",status:"Status",
 expires_at:"Validade",correction_reason:"Correção",price:"Preço",promotion_price:"Promo",stock:"Estoque",unit:"Unidade",
 available:"Disponível",default_radius_km:"Raio",customer_orders_enabled:"Pedidos",vendor_registration_enabled:"Feirantes",
 delivery_enabled:"Entregas",display_name:"Veículo",default_capacity_kg:"Capacidade kg",requires_plate:"Placa",
 requires_vehicle_document:"Documento",requires_cnh:"CNH",active:"Ativo",priority:"Prioridade",base_fee:"Base",per_km:"R$/km",
 per_minute:"R$/min",per_kg:"R$/kg",minimum_charge:"Mínimo",minimum_driver_payout:"Mín. entregador",scope:"Escopo",
 percentage:"%",fixed_amount:"Fixo",label:"Nome",method_type:"Tipo",customer_enabled:"Cliente",vendor_enabled:"Feirante",
 requires_online_provider:"Provedor",actor_role:"Papel",flow_stage:"Etapa",requires_details:"Detalhes",opens_support_ticket:"Suporte",
 penalty_amount:"Penalidade",profile_role:"Papel",vehicle_type:"Veículo",required:"Obrigatório",critical:"Crítico",
 expiration_required:"Validade",payment_status:"Pagamento",subtotal:"Subtotal",delivery_fee:"Frete",total:"Total",
 order_id:"Pedido",delivery_id:"Entregador",cancel_reason:"Cancelamento",accepted_at:"Aceita",delivered_at:"Entregue",
 topic:"Assunto",promotion_type:"Tipo",discount_value:"Desconto",minimum_order:"Pedido mínimo",vendor_pays_delivery:"Patrocina frete",
 starts_at:"Início",ends_at:"Fim",amount:"Valor",provider_reference:"Provedor",requested_at:"Solicitado",paid_at:"Pago",
 author_role:"Autor",target_role:"Alvo",rating:"Nota",comment:"Comentário",visible:"Visível",key:"Chave",enabled:"Ativo",
 public_readable:"Público",area:"Área",title:"Título",audience:"Público",severity:"Tipo",channel:"Canal",title_template:"Título",
 provider:"Provedor",environment:"Ambiente",last_checked_at:"Última verificação",request_type:"Solicitação",resolved_at:"Resolvido",
 admin_id:"Admin",action:"Ação",entity:"Entidade",entity_id:"Registro",code:"Código",file_path:"Arquivo",
 action_type:"Ação",reason:"Motivo",ends_at:"Até",sort_order:"Ordem",permission:"Permissão",
 stall_code:"Box",stall_name:"Banca / box",fair_id:"Feira",vendor_id:"Feirante",method:"Método",
 provider_fee:"Taxa provedor",platform_amount:"Feiraê",vendor_amount:"Feirante",delivery_amount:"Entregador",
 refunded_amount:"Reembolsado",reconciled:"Conciliado",total_distance_km:"Km",eta_minutes:"Minutos"
};
function label(k){return labels[k]||title(k.replaceAll("_"," "));}

const TABLE_SEARCH_FIELDS={
  fairs:["name","state","city","address"],
  profiles:["full_name","phone"],
  vendor_profiles:["business_name","description"],
  delivery_profiles:["city","state","receiving_method"],
  onboarding_documents:["document_type","status","correction_reason"],
  products:["name","unit"],
  categories:["name"],
  service_states:["code","name"],
  service_regions:["code","name","state","city"],
  vehicle_type_rules:["code","display_name"],
  delivery_fee_rules:["name","vehicle_code"],
  platform_fee_rules:["name","scope"],
  payment_method_rules:["code","label","method_type"],
  cancellation_reasons:["code","label","actor_role","flow_stage"],
  onboarding_requirements:["document_type","label","vehicle_type"],
  orders:["payment_status"],
  deliveries:["status","cancel_reason","route_source"],
  support_tickets:["topic","details","status"],
  account_enforcements:["action_type","status","reason"],
  payments:["provider","provider_payment_id","method","status"],
  promotions:["name","promotion_type","rule_text"],
  payouts:["status","provider_reference"],
  order_reviews:["comment","target_role"],
  feature_flags:["key","label","description"],
  content_blocks:["key","area","title","body"],
  system_announcements:["audience","title","body"],
  notification_templates:["key","channel","audience","title_template","body_template"],
  integration_registry:["key","provider","label","environment","status"],
  privacy_requests:["request_type","status","details","resolution_notes"],
  admin_permissions:["permission"],
  admin_audit_logs:["action","entity","entity_id"]
};

function safeSearchTerm(value){
 return String(value||"").trim().replace(/[,*()]/g," ").replace(/\s+/g," ").slice(0,120);
}

function isUuid(value){
 return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}


const ORDER_TRANSITIONS={
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

const reportDefs={
  orders:{label:"Pedidos",table:"orders",dateField:"created_at",cols:["id","status","payment_status","subtotal","delivery_fee","total","created_at"]},
  deliveries:{label:"Entregas",table:"deliveries",dateField:"updated_at",cols:["id","order_id","delivery_id","status","fee","total_distance_km","eta_minutes","cancel_reason","accepted_at","delivered_at","updated_at"]},
  payments:{label:"Pagamentos",table:"payments",dateField:"created_at",cols:["id","order_id","provider","method","status","amount","provider_fee","platform_amount","vendor_amount","delivery_amount","refunded_amount","reconciled","created_at"]},
  payouts:{label:"Financeiro / repasses",table:"payouts",dateField:"created_at",cols:["id","profile_id","role","amount","status","provider_reference","requested_at","paid_at","created_at"]},
  cancellations:{label:"Cancelamentos",table:"orders",dateField:"created_at",cols:["id","status","payment_status","subtotal","delivery_fee","total","refund_amount","created_at"],statuses:["canceled","refunded"]},
  support:{label:"Suporte",table:"support_tickets",dateField:"created_at",cols:["id","order_id","actor_role","topic","priority","status","created_at"]},
  documents:{label:"Documentos",table:"onboarding_documents",dateField:"created_at",cols:["id","profile_id","document_type","status","expires_at","correction_reason","reviewed_at","created_at"]},
  users:{label:"Usuários",table:"profiles",dateField:"created_at",cols:["id","full_name","role","created_at"]},
  reviews:{label:"Avaliações",table:"order_reviews",dateField:"created_at",cols:["id","order_id","author_role","target_role","rating","comment","visible","created_at"]},
  enforcements:{label:"Suspensões e bloqueios",table:"account_enforcements",dateField:"created_at",cols:["id","profile_id","action_type","status","reason","starts_at","ends_at","created_at"]}
};
function inputDate(d){
 const p=(n)=>String(n).padStart(2,"0");
 return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());
}

function cell(k,v){
 if(v===null||v===undefined||v==="")return '<span class="cell-muted">—</span>';
 if(typeof v==="boolean")return '<span class="badge '+v+'">'+(v?"Sim":"Não")+'</span>';
 if(["status","document_status","payment_status"].includes(k))return '<span class="badge '+esc(v)+'">'+esc(v)+'</span>';
 if(k.includes("amount")||k.includes("fee")||["price","promotion_price","subtotal","total","discount_value","fixed_amount","minimum_charge","minimum_driver_payout","penalty_amount"].includes(k))return money(v);
 if(k.endsWith("_at"))return date(v);
 if(typeof v==="object")return '<span class="cell-muted">'+esc(JSON.stringify(v).slice(0,100))+'</span>';
 const s=String(v);return s.length>80?esc(s.slice(0,77))+"…":esc(s);
}

function getConfig(){try{return JSON.parse(localStorage.getItem(CONFIG_KEY)||"null");}catch{return null;}}
function configure(c){state.supabase=createClient(c.url,c.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});}

async function boot(){
 const c=getConfig();
 if(!c?.url||!c?.anonKey){show("setupView");return;}
 configure(c);
 const session=(await state.supabase.auth.getSession()).data.session;
 if(!session){show("loginView");return;}
 const result=await acceptSession(session);
 if(result==="denied")show("loginView");
}

async function ensureAdminMfa(){
 const aal=await state.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
 if(aal.error){loginError(aal.error.message);return "denied";}
 if(aal.data?.currentLevel==="aal2")return "ready";

 const factors=await state.supabase.auth.mfa.listFactors();
 if(factors.error){loginError(factors.error.message);return "denied";}
 const verified=(factors.data?.totp||[]).find((factor)=>factor.status==="verified");
 if(verified){
   state.mfaFactorId=verified.id;
   $("#mfaEnrollment").classList.add("hidden");
   $("#mfaInstructions").textContent="Digite o código atual do seu aplicativo autenticador.";
   $("#mfaError").classList.add("hidden");
   show("mfaView");
   return "mfa";
 }

 const enrollment=await state.supabase.auth.mfa.enroll({
   factorType:"totp",
   friendlyName:"Feiraê Gestão"
 });
 if(enrollment.error){loginError(enrollment.error.message);return "denied";}
 state.mfaFactorId=enrollment.data.id;
 $("#mfaQr").src=enrollment.data.totp.qr_code;
 $("#mfaSecret").textContent=enrollment.data.totp.secret;
 $("#mfaEnrollment").classList.remove("hidden");
 $("#mfaInstructions").textContent="Escaneie o QR Code no autenticador e informe o código gerado.";
 $("#mfaError").classList.add("hidden");
 show("mfaView");
 return "mfa";
}

async function acceptSession(session){
 state.session=session;
 const r=await state.supabase.from("profiles").select("id,full_name,role").eq("id",session.user.id).maybeSingle();
 if(r.error||!r.data||r.data.role!=="admin"){
   await state.supabase.auth.signOut();
   loginError(r.error?.message||"Esta conta não possui papel admin.");
   return "denied";
 }
 state.profile=r.data;
 const access=await state.supabase.from("admin_access").select("active,is_superadmin").eq("profile_id",session.user.id).maybeSingle();
 if(access.error||!access.data){
   await state.supabase.auth.signOut();
   loginError(access.error?.message||"Esta conta não possui acesso administrativo configurado.");
   return "denied";
 }
 if(access.data.active===false){
   await state.supabase.auth.signOut();
   loginError("Este acesso administrativo está desativado.");
   return "denied";
 }

 const mfaResult=await ensureAdminMfa();
 if(mfaResult!=="ready")return mfaResult;

 state.isSuperadmin=Boolean(access.data.is_superadmin);
 const permissions=await state.supabase.from("admin_permissions").select("permission").eq("profile_id",session.user.id);
 if(permissions.error){
   await state.supabase.auth.signOut();
   loginError("Não foi possível carregar as permissões administrativas.");
   return "denied";
 }
 state.permissions=new Set((permissions.data||[]).map((x)=>x.permission));
 renderNav();
 $("#adminIdentity").textContent=(r.data.full_name||session.user.email)+(state.isSuperadmin?" · Superadmin":"");
 show("appView");
 await openModule("dashboard");
 return "ready";
}

async function invokeAdminAction(action,payload={}){
 const result=await state.supabase.functions.invoke("admin-actions",{body:{action,...payload}});
 if(result.error)throw result.error;
 if(result.data?.error)throw new Error(result.data.detail||result.data.error);
 return result.data;
}

function renderNav(){
 $("#nav").innerHTML=navGroups.map((group)=>{
   const name=group[0],items=group[1];
   const allowed=items.filter((it)=>canModule(it[0]));
   if(!allowed.length)return "";
   return '<div class="nav-group"><div class="nav-group-title">'+esc(name)+'</div>'+
     allowed.map((it)=>'<button class="nav-item" data-module="'+esc(it[0])+'">'+esc(it[1])+'</button>').join("")+
     '</div>';
 }).join("");
 document.querySelectorAll("[data-module]").forEach((b)=>b.onclick=()=>openModule(b.dataset.module));
}

async function openModule(id){
 if(!canModule(id)){toast("Você não possui permissão para esta área.");return;}
 state.active=id;state.rows=[];state.selected=new Set();state.page=0;state.query="";
 document.querySelectorAll(".nav-item").forEach((b)=>b.classList.toggle("active",b.dataset.module===id));
 $("#appView").classList.remove("menu-open");
 if(id==="dashboard"){ $("#pageTitle").textContent="Visão geral";$("#breadcrumb").textContent="Operação";await renderDashboard();return; }
 if(id==="reports"){ $("#pageTitle").textContent="Relatórios";$("#breadcrumb").textContent="Análises";await renderReports();return; }
 if(id==="alerts"){ $("#pageTitle").textContent="Alertas";$("#breadcrumb").textContent="Operação";await renderAlerts();return; }
 if(id==="stalls"){ $("#pageTitle").textContent="Bancas / Boxes";$("#breadcrumb").textContent="Cadastros";await renderStalls();return; }
 if(id==="finance"){ $("#pageTitle").textContent="Financeiro";$("#breadcrumb").textContent="Comercial e financeiro";await renderFinance();return; }
 if(id==="integration_health"){ $("#pageTitle").textContent="Saúde das integrações";$("#breadcrumb").textContent="Sistema";await renderIntegrationHealth();return; }
 if(id==="admins"){ $("#pageTitle").textContent="Administradores";$("#breadcrumb").textContent="Sistema";await renderAdmins();return; }
 if(id==="audit"){ $("#pageTitle").textContent="Auditoria";$("#breadcrumb").textContent="Sistema";await renderAuditAdvanced();return; }
 if(id==="settings"){ $("#pageTitle").textContent="Configurações";$("#breadcrumb").textContent="Sistema";await renderSettings();return; }
 const m=modules[id];if(!m)return;
 $("#pageTitle").textContent=m.label;$("#breadcrumb").textContent="Gestão";
 await renderModule(m);
}

async function count(table,fn){
 let q=state.supabase.from(table).select("*",{count:"exact",head:true});
 if(fn)q=fn(q);
 const r=await q;return r.error?null:r.count;
}

async function renderDashboard(){
 $("#pageContent").innerHTML='<div class="empty">Carregando indicadores…</div>';
 const vals=await Promise.all([
   count("orders"),
   count("vendor_profiles",(q)=>q.eq("approved",false)),
   count("delivery_profiles",(q)=>q.eq("approved",false)),
   count("support_tickets",(q)=>q.eq("status","open")),
   count("onboarding_documents",(q)=>q.in("status",["pending","under_review"])),
   count("payouts",(q)=>q.eq("status","requested"))
 ]);
 const recent=(await state.supabase.from("orders").select("id,status,total,created_at").order("created_at",{ascending:false}).limit(6)).data||[];
 const ints=(await state.supabase.from("integration_registry").select("key,label,enabled,status,environment").order("label")).data||[];
 const cards=[["Pedidos",vals[0]],["Feirantes pendentes",vals[1]],["Entregadores pendentes",vals[2]],["Suportes abertos",vals[3]],["Documentos a revisar",vals[4]],["Saques solicitados",vals[5]]];
 let html='<div class="hero"><div><h2>Centro de operação do Feiraê</h2><p>Configurações, cadastros, regras, aprovações, suporte e financeiro em um só lugar.</p></div><div class="hero-badge"><b>'+new Date().toLocaleDateString("pt-BR")+'</b><span>status operacional</span></div></div>';
 if(vals.some((v)=>v===null))html+='<div class="notice">Algumas métricas não puderam ser lidas. Confirme a migration 0003.</div>';
 html+='<div class="kpi-grid">'+cards.map((c)=>'<div class="kpi"><span>'+esc(c[0])+'</span><strong>'+(c[1]??"—")+'</strong></div>').join("")+'</div>';
 html+='<div class="two-col"><section class="panel"><div class="panel-head"><div><h2>Pedidos recentes</h2><p>Últimas movimentações.</p></div></div><div class="list">';
 html+=recent.length?recent.map((o)=>'<div class="list-item"><div><b>#'+esc(String(o.id).slice(0,8))+'</b><br><small>'+date(o.created_at)+'</small></div><div><span class="badge '+esc(o.status)+'">'+esc(o.status)+'</span><br><small>'+money(o.total)+'</small></div></div>').join(""):'<div class="empty">Sem pedidos.</div>';
 html+='</div></section><section class="panel"><div class="panel-head"><div><h2>Integrações</h2><p>Status operacional.</p></div></div><div class="list">';
 html+=ints.length?ints.map((i)=>'<div class="list-item"><div><b>'+esc(i.label)+'</b><br><small>'+esc(i.environment)+'</small></div><span class="badge '+(i.enabled?"active":"false")+'">'+esc(i.status)+'</span></div>').join(""):'<div class="empty">Aplique a migration da gestão.</div>';
 html+='</div></section></div>';
 $("#pageContent").innerHTML=html;
}

async function fetchReportRows(def,from,to){
 let q=state.supabase.from(def.table).select(def.cols.join(",")).gte(def.dateField,from+"T00:00:00").lte(def.dateField,to+"T23:59:59.999").order(def.dateField,{ascending:false}).limit(5000);
 if(def.statuses?.length)q=q.in("status",def.statuses);
 const r=await q;
 if(r.error)throw r.error;
 return r.data||[];
}

function reportKpi(labelText,value,helper=""){
 return '<div class="kpi"><span>'+esc(labelText)+'</span><strong>'+esc(value)+'</strong>'+(helper?'<small>'+esc(helper)+'</small>':"")+'</div>';
}

async function renderReports(){
 const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),1);
 $("#pageContent").innerHTML=
   '<section class="panel report-panel"><div class="panel-head"><div><h2>Relatórios da operação</h2><p>Filtre por período, consulte indicadores e exporte os dados.</p></div></div>'+
   '<div class="report-filters">'+
     '<label>Relatório<select id="reportType">'+
       '<option value="summary">Resumo executivo</option>'+
       Object.entries(reportDefs).map(([k,v])=>'<option value="'+esc(k)+'">'+esc(v.label)+'</option>').join("")+
     '</select></label>'+
     '<label>De<input id="reportFrom" type="date" value="'+inputDate(start)+'"></label>'+
     '<label>Até<input id="reportTo" type="date" value="'+inputDate(now)+'"></label>'+
     '<div class="report-actions"><button id="runReport" class="primary">Gerar relatório</button><button id="exportReport" class="secondary" disabled>Exportar CSV</button><button id="printReport" class="secondary">Imprimir / PDF</button></div>'+
   '</div></section><div id="reportResult"><div class="empty">Gerando resumo do período…</div></div>';
 $("#runReport").onclick=loadReport;
 $("#exportReport").onclick=exportCurrentReport;
 $("#printReport").onclick=()=>window.print();
 await loadReport();
}

async function loadReport(){
 const type=$("#reportType").value,from=$("#reportFrom").value,to=$("#reportTo").value;
 if(!from||!to){toast("Informe o período do relatório.");return;}
 if(new Date(to)<new Date(from)){toast("A data final precisa ser igual ou posterior à inicial.");return;}
 $("#reportResult").innerHTML='<div class="empty">Carregando relatório…</div>';
 $("#exportReport").disabled=true;
 try{
   if(type==="summary"){
     const [orders,payouts,deliveries,support]=await Promise.all([
       fetchReportRows(reportDefs.orders,from,to),
       fetchReportRows(reportDefs.payouts,from,to),
       fetchReportRows(reportDefs.deliveries,from,to),
       fetchReportRows(reportDefs.support,from,to)
     ]);
     const delivered=orders.filter((r)=>r.status==="delivered").length;
     const canceled=orders.filter((r)=>["canceled","refunded"].includes(r.status)).length;
     const gross=orders.reduce((s,r)=>s+Number(r.total||0),0);
     const freight=orders.reduce((s,r)=>s+Number(r.delivery_fee||0),0);
     const payoutsPaid=payouts.filter((r)=>r.status==="paid").reduce((s,r)=>s+Number(r.amount||0),0);
     const openSupport=support.filter((r)=>r.status==="open").length;
     const avg=orders.length?gross/orders.length:0;
     state.reportRows=orders;
     state.reportColumns=reportDefs.orders.cols;
     state.reportName="resumo-pedidos";
     $("#reportResult").innerHTML=
       '<div class="kpi-grid report-kpis">'+
         reportKpi("Pedidos",orders.length)+
         reportKpi("Entregues",delivered)+
         reportKpi("Cancelados / reembolsados",canceled)+
         reportKpi("Valor bruto",money(gross))+
         reportKpi("Frete cobrado",money(freight))+
         reportKpi("Ticket médio",money(avg))+
         reportKpi("Repasses pagos",money(payoutsPaid))+
         reportKpi("Suportes abertos",openSupport)+
         reportKpi("Entregas movimentadas",deliveries.length)+
       '</div>'+
       reportTableHtml("Pedidos do período",reportDefs.orders.cols,orders);
   }else{
     const def=reportDefs[type],rows=await fetchReportRows(def,from,to);
     state.reportRows=rows;state.reportColumns=def.cols;state.reportName=type;
     $("#reportResult").innerHTML=
       '<div class="kpi-grid report-kpis">'+
         reportKpi("Registros",rows.length)+
         (type==="orders"?reportKpi("Valor total",money(rows.reduce((s,r)=>s+Number(r.total||0),0))):"")+
         (type==="payments"?reportKpi("Volume pago",money(rows.reduce((s,r)=>s+Number(r.amount||0),0))):"")+
         (type==="deliveries"?reportKpi("Taxas de entrega",money(rows.reduce((s,r)=>s+Number(r.fee||0),0))):"")+
         (type==="payouts"?reportKpi("Valor dos repasses",money(rows.reduce((s,r)=>s+Number(r.amount||0),0))):"")+
         (type==="reviews"&&rows.length?reportKpi("Nota média",(rows.reduce((s,r)=>s+Number(r.rating||0),0)/rows.length).toFixed(2)):"")+
       '</div>'+
       reportTableHtml(def.label,def.cols,rows);
   }
   $("#exportReport").disabled=!state.reportRows?.length;
 }catch(e){
   state.reportRows=[];state.reportColumns=[];state.reportName="";
   $("#reportResult").innerHTML='<div class="notice"><b>Não foi possível gerar o relatório.</b><br>'+esc(e.message||String(e))+'</div>';
 }
}

function reportTableHtml(titleText,cols,rows){
 return '<section class="panel report-output"><div class="panel-head"><div><h2>'+esc(titleText)+'</h2><p>'+rows.length+' registros no período.</p></div></div>'+
   '<div class="table-wrap"><table><thead><tr>'+cols.map((k)=>'<th>'+esc(label(k))+'</th>').join("")+'</tr></thead><tbody>'+
   (rows.length?rows.map((row)=>'<tr>'+cols.map((k)=>'<td>'+cell(k,row[k])+'</td>').join("")+'</tr>').join(""):'<tr><td colspan="'+cols.length+'" class="empty">Nenhum registro encontrado.</td></tr>')+
   '</tbody></table></div></section>';
}

function exportCurrentReport(){
 const rows=state.reportRows||[],cols=state.reportColumns||[];
 if(!rows.length||!cols.length){toast("Não há dados para exportar.");return;}
 const csvValue=(v)=>{
   if(v===null||v===undefined)return '""';
   const raw=typeof v==="object"?JSON.stringify(v):String(v);
   return '"'+raw.replaceAll('"','""')+'"';
 };
 const csv=[cols.map((k)=>csvValue(label(k))).join(";"),...rows.map((row)=>cols.map((k)=>csvValue(row[k])).join(";"))].join("\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="feirae-"+(state.reportName||"relatorio")+"-"+inputDate(new Date())+".csv";
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}


function detailPairs(pairs){
 return '<div class="detail-grid">'+pairs.map(([k,v])=>'<div class="detail-card"><span>'+esc(k)+'</span><strong>'+cell(k.toLowerCase().replaceAll(" ","_"),v)+'</strong></div>').join("")+'</div>';
}

function miniTable(titleText,cols,rows){
 return '<section class="panel detail-section"><div class="panel-head"><div><h2>'+esc(titleText)+'</h2><p>'+rows.length+' registro(s)</p></div></div><div class="table-wrap"><table><thead><tr>'+cols.map((k)=>'<th>'+esc(label(k))+'</th>').join("")+'</tr></thead><tbody>'+
 (rows.length?rows.map((r)=>'<tr>'+cols.map((k)=>'<td>'+cell(k,r[k])+'</td>').join("")+'</tr>').join(""):'<tr><td colspan="'+cols.length+'" class="empty">Sem registros.</td></tr>')+
 '</tbody></table></div></section>';
}

async function renderOrderDetail(orderId){
 $("#pageTitle").textContent="Detalhe do pedido";
 $("#breadcrumb").textContent="Pedidos";
 $("#pageContent").innerHTML='<div class="empty">Carregando pedido…</div>';
 try{
   const orderR=await state.supabase.from("orders").select("*").eq("id",orderId).single();
   if(orderR.error)throw orderR.error;
   const order=orderR.data;
   const queries=[
     state.supabase.from("order_items").select("*").eq("order_id",orderId),
     state.supabase.from("order_vendors").select("*").eq("order_id",orderId),
     state.supabase.from("deliveries").select("*").eq("order_id",orderId).maybeSingle(),
     state.supabase.from("payments").select("*").eq("order_id",orderId).order("created_at",{ascending:false}),
     state.supabase.from("order_events").select("*").eq("order_id",orderId).order("created_at",{ascending:true}),
     state.supabase.from("support_tickets").select("*").eq("order_id",orderId).order("created_at",{ascending:false}),
     state.supabase.from("order_reviews").select("*").eq("order_id",orderId).order("created_at",{ascending:false}),
     state.supabase.from("profiles").select("id,full_name,phone,role").eq("id",order.customer_id).maybeSingle()
   ];
   if(order.address_id)queries.push(state.supabase.from("addresses").select("*").eq("id",order.address_id).maybeSingle());
   const res=await Promise.all(queries);
   const bad=res.find((x)=>x.error);if(bad)throw bad.error;
   const [items,vendors,delivery,payments,events,support,reviews,customer,address]=res;
   let html='<div class="detail-head"><button class="secondary" id="backOrders">← Pedidos</button><div><b>#'+esc(order.id)+'</b><span class="badge '+esc(order.status)+'">'+esc(order.status)+'</span>'+
   ((ORDER_TRANSITIONS[order.status]||[]).length?'<button class="primary" id="transitionOrder">Alterar etapa</button>':"")+
   '</div></div>';
   html+=detailPairs([
     ["Cliente",customer.data?.full_name||order.customer_id],
     ["Pagamento",order.payment_status],
     ["Subtotal",money(order.subtotal)],
     ["Frete",money(order.delivery_fee)],
     ["Desconto",money(order.promotion_discount||0)],
     ["Carteira",money(order.wallet_used||0)],
     ["Reembolso",money(order.refund_amount||0)],
     ["Total",money(order.total)],
     ["Criado em",date(order.created_at)]
   ]);
   if(address?.data)html+=miniTable("Endereço",["recipient_name","address_line","number","neighborhood","city","state","postal_code"],[address.data]);
   html+=miniTable("Itens",["product_name_snapshot","unit_price_snapshot","quantity","estimated_weight_kg","actual_weight_kg","total","unavailable"],items.data||[]);
   html+=miniTable("Bancas do pedido",["vendor_id","status","subtotal"],vendors.data||[]);
   if(delivery.data)html+=miniTable("Entrega",["id","delivery_id","status","fee","total_distance_km","eta_minutes","cancel_reason","accepted_at","collected_at","out_for_delivery_at","delivered_at"],[delivery.data]);
   html+=miniTable("Pagamentos",["provider","method","status","amount","provider_fee","platform_amount","vendor_amount","delivery_amount","refunded_amount","reconciled","created_at"],payments.data||[]);
   html+=miniTable("Linha do tempo",["created_at","actor_role","event_key","label","reason","details"],events.data||[]);
   html+=miniTable("Suporte",["created_at","actor_role","topic","priority","status","details"],support.data||[]);
   html+=miniTable("Avaliações",["created_at","author_role","target_role","rating","comment","visible"],reviews.data||[]);
   $("#pageContent").innerHTML=html;
   $("#backOrders").onclick=()=>openModule("orders");
   if($("#transitionOrder"))$("#transitionOrder").onclick=()=>openOrderTransition(order);
 }catch(e){renderError(e);}
}

async function renderDeliveryDetail(deliveryId){
 $("#pageTitle").textContent="Detalhe da entrega";
 $("#breadcrumb").textContent="Entregas";
 $("#pageContent").innerHTML='<div class="empty">Carregando entrega…</div>';
 try{
   const dR=await state.supabase.from("deliveries").select("*").eq("id",deliveryId).single();
   if(dR.error)throw dR.error;
   const d=dR.data;
   const [order,driver,vehicle,events,reviews]=await Promise.all([
     state.supabase.from("orders").select("*").eq("id",d.order_id).maybeSingle(),
     d.delivery_id?state.supabase.from("profiles").select("id,full_name,phone").eq("id",d.delivery_id).maybeSingle():Promise.resolve({data:null,error:null}),
     d.vehicle_id?state.supabase.from("delivery_vehicles").select("*").eq("id",d.vehicle_id).maybeSingle():Promise.resolve({data:null,error:null}),
     state.supabase.from("order_events").select("*").eq("order_id",d.order_id).order("created_at",{ascending:true}),
     state.supabase.from("order_reviews").select("*").eq("order_id",d.order_id).eq("target_role","delivery").order("created_at",{ascending:false})
   ]);
   const bad=[order,driver,vehicle,events,reviews].find((x)=>x.error);if(bad)throw bad.error;
   const canIntervene=!["collected","out_for_delivery","delivered","canceled"].includes(String(d.status));
   let html='<div class="detail-head"><button class="secondary" id="backDeliveries">← Entregas</button><div><b>#'+esc(d.id)+'</b><span class="badge '+esc(d.status)+'">'+esc(d.status)+'</span>'+
   (canIntervene?'<button class="secondary" id="removeDeliveryDriver">Remover entregador</button><button class="secondary" id="reassignDelivery">Reatribuir</button><button class="danger-btn" id="cancelDelivery">Cancelar corrida</button>':"")+
   '</div></div>';
   html+=detailPairs([
     ["Pedido",d.order_id],
     ["Entregador",driver.data?.full_name||d.delivery_id||"Não atribuído"],
     ["Valor da entrega",money(d.fee)],
     ["Até a banca (km)",d.to_vendor_km],
     ["Banca → cliente (km)",d.vendor_to_customer_km],
     ["Total (km)",d.total_distance_km],
     ["ETA (min)",d.eta_minutes],
     ["Fonte da rota",d.route_source||"—"],
     ["Aceita",date(d.accepted_at)],
     ["Coletada",date(d.collected_at)],
     ["Em rota",date(d.out_for_delivery_at)],
     ["Entregue",date(d.delivered_at)]
   ]);
   if(vehicle.data)html+=miniTable("Veículo usado",["vehicle_type","brand_model","plate","capacity_kg","active","document_status"],[vehicle.data]);
   if(order.data)html+=miniTable("Pedido relacionado",["id","status","payment_status","subtotal","delivery_fee","total","created_at"],[order.data]);
   html+=miniTable("Linha do tempo",["created_at","actor_role","event_key","label","reason","details"],events.data||[]);
   html+=miniTable("Avaliações da entrega",["created_at","author_role","rating","comment","visible"],reviews.data||[]);
   $("#pageContent").innerHTML=html;
   $("#backDeliveries").onclick=()=>openModule("delivery_jobs");
   if($("#removeDeliveryDriver"))$("#removeDeliveryDriver").onclick=()=>runDeliveryAction("delivery_remove_driver",d);
   if($("#reassignDelivery"))$("#reassignDelivery").onclick=()=>openDeliveryReassign(d);
   if($("#cancelDelivery"))$("#cancelDelivery").onclick=()=>openDeliveryCancel(d);
 }catch(e){renderError(e);}
}



function openOrderTransition(order){
 const options=ORDER_TRANSITIONS[order.status]||[];
 if(!options.length){toast("Este pedido não possui transição administrativa disponível.");return;}
 state.editing={special:"order_transition",order};
 $("#modalTitle").textContent="Alterar etapa do pedido";
 $("#editorForm").innerHTML=
   '<label>Status atual<input value="'+esc(order.status)+'" disabled></label>'+
   '<label>Próxima etapa<select id="secureNextStatus">'+options.map((x)=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("")+'</select></label>'+
   '<label class="full-span">Motivo / observação<textarea id="secureReason" rows="4" placeholder="Descreva por que a intervenção é necessária"></textarea></label>';
 $("#modal").classList.remove("hidden");
}

async function runDeliveryAction(action,delivery,payload={}){
 try{
   await invokeAdminAction(action,{delivery_id:delivery.id,...payload});
   toast("Entrega atualizada com segurança.");
   await renderDeliveryDetail(delivery.id);
 }catch(e){toast(e.message||String(e));}
}

async function openDeliveryReassign(delivery){
 const [profiles,approved]=await Promise.all([
   state.supabase.from("profiles").select("id,full_name").order("full_name"),
   state.supabase.from("delivery_profiles").select("id,approved").eq("approved",true)
 ]);
 if(profiles.error||approved.error){toast(profiles.error?.message||approved.error?.message);return;}
 const approvedIds=new Set((approved.data||[]).map((x)=>x.id));
 const rows=(profiles.data||[]).filter((x)=>approvedIds.has(x.id));
 state.editing={special:"delivery_reassign",delivery};
 $("#modalTitle").textContent="Reatribuir entrega";
 $("#editorForm").innerHTML='<label class="full-span">Entregador aprovado<select id="secureDeliveryDriver"><option value="">Selecione</option>'+
 rows.map((x)=>'<option value="'+esc(x.id)+'">'+esc(x.full_name||x.id)+'</option>').join("")+
 '</select></label>';
 $("#modal").classList.remove("hidden");
}

function openDeliveryCancel(delivery){
 state.editing={special:"delivery_cancel",delivery};
 $("#modalTitle").textContent="Cancelar corrida";
 $("#editorForm").innerHTML='<label class="full-span">Motivo<textarea id="secureDeliveryReason" rows="4" required></textarea></label>';
 $("#modal").classList.remove("hidden");
}

function openDocumentReview(row){
 state.editing={special:"document_review",row};
 $("#modalTitle").textContent="Revisar documento";
 $("#editorForm").innerHTML=
   '<label>Status<select id="secureDocumentStatus">'+["under_review","approved","correction_required","rejected"].map((x)=>'<option value="'+x+'" '+(row.status===x?"selected":"")+'>'+x+'</option>').join("")+'</select></label>'+
   '<label>Validade<input id="secureDocumentExpiry" type="date" value="'+esc(row.expires_at||"")+'"></label>'+
   '<label class="full-span">Motivo / correção<textarea id="secureDocumentReason" rows="4">'+esc(row.correction_reason||"")+'</textarea></label>';
 $("#modal").classList.remove("hidden");
}

function openSupportUpdate(row){
 state.editing={special:"support_update",row};
 $("#modalTitle").textContent="Atender ticket";
 $("#editorForm").innerHTML=
   '<label>Prioridade<select id="secureSupportPriority"><option value="normal" '+(row.priority==="normal"?"selected":"")+'>Normal</option><option value="urgent" '+(row.priority==="urgent"?"selected":"")+'>Urgente</option></select></label>'+
   '<label>Status<select id="secureSupportStatus">'+["open","resolved","closed"].map((x)=>'<option value="'+x+'" '+(row.status===x?"selected":"")+'>'+x+'</option>').join("")+'</select></label>'+
   '<label class="full-span">Detalhes<textarea id="secureSupportDetails" rows="5">'+esc(row.details||"")+'</textarea></label>';
 $("#modal").classList.remove("hidden");
}

async function togglePaymentReconcile(row){
 try{
   await invokeAdminAction("payment_reconcile",{payment_id:row.id,reconciled:!row.reconciled});
   toast(row.reconciled?"Conciliação desfeita.":"Pagamento conciliado.");
   await openModule("payments");
 }catch(e){toast(e.message||String(e));}
}

function openReviewModeration(row){
 state.editing={special:"review_moderate",row};
 $("#modalTitle").textContent="Moderar avaliação";
 $("#editorForm").innerHTML=
   '<label class="check-row"><input id="secureReviewVisible" type="checkbox" '+(row.visible!==false?"checked":"")+'><span>Visível</span></label>'+
   '<label class="full-span">Motivo da moderação<textarea id="secureReviewReason" rows="4">'+esc(row.moderation_reason||"")+'</textarea></label>';
 $("#modal").classList.remove("hidden");
}

function openPrivacyUpdate(row){
 state.editing={special:"privacy_update",row};
 $("#modalTitle").textContent="Tratar solicitação LGPD";
 $("#editorForm").innerHTML=
   '<label>Status<select id="securePrivacyStatus">'+["open","in_review","completed","rejected"].map((x)=>'<option value="'+x+'" '+(row.status===x?"selected":"")+'>'+x+'</option>').join("")+'</select></label>'+
   '<label class="full-span">Resolução<textarea id="securePrivacyNotes" rows="5">'+esc(row.resolution_notes||"")+'</textarea></label>';
 $("#modal").classList.remove("hidden");
}

async function openEnforcementCreate(profileId=null,actionType="suspension"){
 state.editing={special:"enforcement_create",profileId,actionType};
 $("#modalTitle").textContent="Nova suspensão ou bloqueio";
 const fixed=profileId
   ? '<label class="full-span">Usuário<input id="secureEnforcementProfile" value="'+esc(profileId)+'" readonly></label>'
   : '<label class="full-span">Buscar usuário<input id="secureProfileSearch" placeholder="Digite o nome"><select id="secureEnforcementProfile"><option value="">Busque e selecione</option></select></label>';
 $("#editorForm").innerHTML=fixed+
   '<label>Ação<select id="secureEnforcementType">'+["suspension","ban","orders_block","sales_block","deliveries_block"].map((x)=>'<option value="'+x+'" '+(actionType===x?"selected":"")+'>'+x+'</option>').join("")+'</select></label>'+
   '<label>Até<input id="secureEnforcementEnd" type="datetime-local"></label>'+
   '<label class="full-span">Motivo<textarea id="secureEnforcementReason" rows="4" required></textarea></label>';
 $("#modal").classList.remove("hidden");
 if(!profileId){
   let timer;
   $("#secureProfileSearch").oninput=(e)=>{
     clearTimeout(timer);
     timer=setTimeout(async()=>{
       const term=safeSearchTerm(e.target.value);
       if(term.length<2)return;
       const r=await state.supabase.from("profiles").select("id,full_name,role").ilike("full_name","%"+term+"%").order("full_name").limit(20);
       if(r.error){toast(r.error.message);return;}
       $("#secureEnforcementProfile").innerHTML='<option value="">Selecione</option>'+(r.data||[]).map((x)=>'<option value="'+esc(x.id)+'">'+esc((x.full_name||x.id)+" · "+x.role)+'</option>').join("");
     },250);
   };
 }
}

function openEnforcement(profileId,actionType){
 if(!canModule("enforcements")){toast("Sem permissão para suspensões e bloqueios.");return;}
 openEnforcementCreate(profileId,actionType);
}

async function revokeEnforcement(row){
 if(!confirm("Revogar esta restrição mantendo o histórico?"))return;
 try{
   await invokeAdminAction("enforcement_revoke",{enforcement_id:row.id});
   toast("Restrição revogada.");
   await openModule("enforcements");
 }catch(e){toast(e.message||String(e));}
}

async function saveSecureAction(){
 const edit=state.editing;
 if(!edit?.special)return false;

 if(edit.special==="order_transition"){
   await invokeAdminAction("order_transition",{
     order_id:edit.order.id,
     next_status:$("#secureNextStatus").value,
     reason:$("#secureReason").value.trim()
   });
   return {module:"orders",message:"Etapa do pedido atualizada."};
 }
 if(edit.special==="delivery_reassign"){
   const next=$("#secureDeliveryDriver").value;
   if(!next)throw new Error("Selecione um entregador.");
   await invokeAdminAction("delivery_reassign",{delivery_id:edit.delivery.id,next_delivery_id:next});
   return {detail:()=>renderDeliveryDetail(edit.delivery.id),message:"Entrega reatribuída."};
 }
 if(edit.special==="delivery_cancel"){
   const reason=$("#secureDeliveryReason").value.trim();
   if(!reason)throw new Error("Informe o motivo.");
   await invokeAdminAction("delivery_cancel",{delivery_id:edit.delivery.id,reason});
   return {detail:()=>renderDeliveryDetail(edit.delivery.id),message:"Corrida cancelada."};
 }
 if(edit.special==="document_review"){
   await invokeAdminAction("document_review",{
     document_id:edit.row.id,
     status:$("#secureDocumentStatus").value,
     expires_at:$("#secureDocumentExpiry").value||null,
     correction_reason:$("#secureDocumentReason").value.trim()
   });
   return {module:"documents",message:"Documento revisado e responsável registrado."};
 }
 if(edit.special==="support_update"){
   await invokeAdminAction("support_update",{
     ticket_id:edit.row.id,
     priority:$("#secureSupportPriority").value,
     status:$("#secureSupportStatus").value,
     details:$("#secureSupportDetails").value
   });
   return {module:"support",message:"Ticket atualizado."};
 }
 if(edit.special==="review_moderate"){
   await invokeAdminAction("review_moderate",{
     review_id:edit.row.id,
     visible:$("#secureReviewVisible").checked,
     reason:$("#secureReviewReason").value.trim()
   });
   return {module:"reviews",message:"Avaliação moderada e responsável registrado."};
 }
 if(edit.special==="privacy_update"){
   await invokeAdminAction("privacy_update",{
     request_id:edit.row.id,
     status:$("#securePrivacyStatus").value,
     resolution_notes:$("#securePrivacyNotes").value.trim()
   });
   return {module:"privacy",message:"Solicitação LGPD atualizada."};
 }
 if(edit.special==="enforcement_create"){
   const profileId=$("#secureEnforcementProfile").value;
   const type=$("#secureEnforcementType").value;
   const reason=$("#secureEnforcementReason").value.trim();
   if(!profileId||!reason)throw new Error("Selecione o usuário e informe o motivo.");
   const endRaw=$("#secureEnforcementEnd").value;
   await invokeAdminAction("enforcement_create",{
     profile_id:profileId,
     action_type:type,
     reason,
     starts_at:new Date().toISOString(),
     ends_at:endRaw?new Date(endRaw).toISOString():null
   });
   return {module:"enforcements",message:"Restrição criada e auditada."};
 }
 return false;
}

async function renderProfile360(kind,row){
 const profileId=row.id;
 $("#pageTitle").textContent=kind==="vendor"?"Feirante 360°":kind==="delivery"?"Entregador 360°":"Cliente 360°";
 $("#breadcrumb").textContent="Cadastros";
 $("#pageContent").innerHTML='<div class="empty">Carregando visão completa…</div>';
 try{
   const profile=await state.supabase.from("profiles").select("id,full_name,phone,role,created_at").eq("id",profileId).maybeSingle();
   if(profile.error)throw profile.error;
   const sections=[];
   if(kind==="customer"){
     if(canModule("orders"))sections.push(["Pedidos",await state.supabase.from("orders").select("id,status,payment_status,total,created_at").eq("customer_id",profileId).order("created_at",{ascending:false}).limit(50),["id","status","payment_status","total","created_at"]]);
     if(canModule("support"))sections.push(["Suporte",await state.supabase.from("support_tickets").select("id,topic,priority,status,created_at").eq("opened_by",profileId).order("created_at",{ascending:false}).limit(50),["id","topic","priority","status","created_at"]]);
     if(canModule("reviews"))sections.push(["Avaliações",await state.supabase.from("order_reviews").select("id,author_role,target_role,rating,comment,created_at").eq("author_id",profileId).order("created_at",{ascending:false}).limit(50),["id","author_role","target_role","rating","comment","created_at"]]);
   }
   if(kind==="vendor"){
     sections.push(["Feiras e boxes",await state.supabase.from("fair_vendor_memberships").select("fair_id,stall_code,stall_name,active,updated_at").eq("vendor_id",profileId),["fair_id","stall_code","stall_name","active","updated_at"]]);
     sections.push(["Lojas",await state.supabase.from("vendor_stores").select("id,name,is_open,delivery_enabled,pickup_enabled,updated_at").eq("vendor_id",profileId),["id","name","is_open","delivery_enabled","pickup_enabled","updated_at"]]);
     sections.push(["Produtos",await state.supabase.from("products").select("id,name,price,stock,available,updated_at").eq("vendor_id",profileId).order("updated_at",{ascending:false}).limit(100),["id","name","price","stock","available","updated_at"]]);
   }
   if(kind==="delivery"){
     sections.push(["Veículos",await state.supabase.from("delivery_vehicles").select("id,vehicle_type,brand_model,plate,capacity_kg,active,document_status,updated_at").eq("delivery_id",profileId),["id","vehicle_type","brand_model","plate","capacity_kg","active","document_status","updated_at"]]);
     sections.push(["Disponibilidade",await state.supabase.from("delivery_preferences").select("online,radius_km,preferred_distance_km,regions,auto_schedule,schedule_start,schedule_end,updated_at").eq("delivery_id",profileId),["online","radius_km","preferred_distance_km","regions","auto_schedule","schedule_start","schedule_end","updated_at"]]);
     if(canModule("delivery_jobs"))sections.push(["Corridas",await state.supabase.from("deliveries").select("id,order_id,status,fee,total_distance_km,accepted_at,delivered_at").eq("delivery_id",profileId).order("updated_at",{ascending:false}).limit(50),["id","order_id","status","fee","total_distance_km","accepted_at","delivered_at"]]);
   }
   if(canModule("documents"))sections.push(["Documentos",await state.supabase.from("onboarding_documents").select("id,document_type,status,expires_at,reviewed_at").eq("profile_id",profileId).order("updated_at",{ascending:false}),["id","document_type","status","expires_at","reviewed_at"]]);
   if(canModule("payouts"))sections.push(["Repasses",await state.supabase.from("payouts").select("id,role,amount,status,requested_at,paid_at,created_at").eq("profile_id",profileId).order("created_at",{ascending:false}).limit(50),["id","role","amount","status","requested_at","paid_at","created_at"]]);
   if(canModule("enforcements"))sections.push(["Restrições",await state.supabase.from("account_enforcements").select("id,action_type,status,reason,starts_at,ends_at,created_at").eq("profile_id",profileId).order("created_at",{ascending:false}),["id","action_type","status","reason","starts_at","ends_at","created_at"]]);

   const bad=sections.map((x)=>x[1]).find((x)=>x.error);if(bad)throw bad.error;
   let html='<div class="detail-head"><button class="secondary" id="backProfile360">← Voltar</button><div><b>'+esc(profile.data?.full_name||profileId)+'</b><span class="badge active">'+esc(profile.data?.role||kind)+'</span></div></div>';
   html+=detailPairs([["Nome",profile.data?.full_name||"—"],["Telefone",profile.data?.phone||"—"],["Papel",profile.data?.role||kind],["Cadastro",date(profile.data?.created_at)]]);
   for(const [titleText,result,cols] of sections)html+=miniTable(titleText,cols,result.data||[]);
   $("#pageContent").innerHTML=html;
   $("#backProfile360").onclick=()=>openModule(kind==="vendor"?"vendors":kind==="delivery"?"drivers":"users");
 }catch(e){renderError(e);}
}

async function renderStalls(){
 $("#pageContent").innerHTML='<div class="empty">Carregando bancas e boxes…</div>';
 try{
   const [memberships,fairs,vendors]=await Promise.all([
     state.supabase.from("fair_vendor_memberships").select("*").order("updated_at",{ascending:false}).limit(1000),
     state.supabase.from("fairs").select("id,name,state,city").order("name"),
     state.supabase.from("vendor_profiles").select("id,business_name,approved").order("business_name")
   ]);
   const bad=[memberships,fairs,vendors].find((x)=>x.error);if(bad)throw bad.error;
   const fairMap=Object.fromEntries((fairs.data||[]).map((x)=>[x.id,x]));
   const vendorMap=Object.fromEntries((vendors.data||[]).map((x)=>[x.id,x]));
   state.stallContext={fairs:fairs.data||[],vendors:vendors.data||[]};
   let html='<section class="panel"><div class="panel-head"><div><h2>Bancas / Boxes</h2><p>Vincule feira, feirante, box e horários sem usar UUID manualmente.</p></div><button class="primary" id="newStall">Nova banca / box</button></div><div class="table-wrap"><table><thead><tr><th>Feira</th><th>Feirante</th><th>Box</th><th>Nome</th><th>Ativa</th><th>Atualizado</th><th>Ações</th></tr></thead><tbody>';
   html+=(memberships.data||[]).length?(memberships.data||[]).map((row,i)=>{
     const fair=fairMap[row.fair_id],vendor=vendorMap[row.vendor_id];
     return '<tr><td>'+esc(fair?.name||row.fair_id)+'</td><td>'+esc(vendor?.business_name||row.vendor_id)+'</td><td>'+esc(row.stall_code||"—")+'</td><td>'+esc(row.stall_name||"—")+'</td><td>'+cell("active",row.active)+'</td><td>'+date(row.updated_at)+'</td><td><div class="actions"><button data-stall-edit="'+i+'">Editar</button><button data-stall-toggle="'+i+'">'+(row.active?"Desativar":"Ativar")+'</button></div></td></tr>';
   }).join(""):'<tr><td colspan="7" class="empty">Nenhuma banca/box cadastrada.</td></tr>';
   html+='</tbody></table></div></section>';
   $("#pageContent").innerHTML=html;
   $("#newStall").onclick=()=>openStallEditor(null);
   document.querySelectorAll("[data-stall-edit]").forEach((b)=>b.onclick=()=>openStallEditor(memberships.data[Number(b.dataset.stallEdit)]));
   document.querySelectorAll("[data-stall-toggle]").forEach((b)=>b.onclick=async()=>{
     const row=memberships.data[Number(b.dataset.stallToggle)];
     const r=await state.supabase.from("fair_vendor_memberships").update({active:!row.active,updated_at:new Date().toISOString()}).eq("id",row.id);
     if(r.error){toast(r.error.message);return;}toast(row.active?"Banca desativada.":"Banca ativada.");await renderStalls();
   });
 }catch(e){renderError(e);}
}

function openStallEditor(row){
 const ctx=state.stallContext||{fairs:[],vendors:[]};
 state.editing={special:"stall",row,isNew:!row};
 $("#modalTitle").textContent=row?"Editar banca / box":"Nova banca / box";
 $("#editorForm").innerHTML=
   '<label>Feira<select id="stallFair"><option value="">Selecione</option>'+ctx.fairs.map((x)=>'<option value="'+esc(x.id)+'" '+(row?.fair_id===x.id?"selected":"")+'>'+esc(x.name+" · "+(x.city||x.state||""))+'</option>').join("")+'</select></label>'+
   '<label>Feirante<select id="stallVendor"><option value="">Selecione</option>'+ctx.vendors.map((x)=>'<option value="'+esc(x.id)+'" '+(row?.vendor_id===x.id?"selected":"")+'>'+esc(x.business_name+(x.approved?"":" · pendente"))+'</option>').join("")+'</select></label>'+
   '<label>Código do box<input id="stallCode" value="'+esc(row?.stall_code||"")+'"></label>'+
   '<label>Nome da banca/box<input id="stallName" value="'+esc(row?.stall_name||"")+'"></label>'+
   '<label class="full-span">Horários próprios (JSON)<textarea id="stallHours" rows="4">'+esc(row?.custom_opening_hours?JSON.stringify(row.custom_opening_hours,null,2):"{}")+'</textarea></label>'+
   '<label class="full-span">Observações<textarea id="stallNotes" rows="3">'+esc(row?.notes||"")+'</textarea></label>'+
   '<label class="check-row"><input id="stallActive" type="checkbox" '+(row?.active!==false?"checked":"")+'><span>Ativa</span></label>';
 $("#modal").classList.remove("hidden");
}

async function saveStallEditor(){
 const {row,isNew}=state.editing;
 const fair_id=$("#stallFair").value,vendor_id=$("#stallVendor").value;
 if(!fair_id||!vendor_id){toast("Selecione a feira e o feirante.");return false;}
 let hours;try{hours=JSON.parse($("#stallHours").value||"{}");}catch{toast("Horários em JSON inválido.");return false;}
 const payload={fair_id,vendor_id,stall_code:$("#stallCode").value.trim()||null,stall_name:$("#stallName").value.trim()||null,custom_opening_hours:hours,notes:$("#stallNotes").value.trim()||null,active:$("#stallActive").checked,updated_at:new Date().toISOString()};
 const r=isNew
   ?await state.supabase.from("fair_vendor_memberships").insert(payload)
   :await state.supabase.from("fair_vendor_memberships").update(payload).eq("id",row.id);
 if(r.error){toast(r.error.message);return false;}
 return true;
}

async function renderFinance(){
 $("#pageContent").innerHTML='<div class="empty">Carregando conciliação financeira…</div>';
 try{
   const [payments,payouts]=await Promise.all([
     state.supabase.from("payments").select("*").order("created_at",{ascending:false}).limit(1000),
     state.supabase.from("payouts").select("*").order("created_at",{ascending:false}).limit(1000)
   ]);
   if(payments.error)throw payments.error;if(payouts.error)throw payouts.error;
   const rows=payments.data||[];
   const gross=rows.reduce((s,r)=>s+Number(r.amount||0),0);
   const provider=rows.reduce((s,r)=>s+Number(r.provider_fee||0),0);
   const platform=rows.reduce((s,r)=>s+Number(r.platform_amount||r.commission||0),0);
   const vendors=rows.reduce((s,r)=>s+Number(r.vendor_amount||0),0);
   const drivers=rows.reduce((s,r)=>s+Number(r.delivery_amount||0),0);
   const refunded=rows.reduce((s,r)=>s+Number(r.refunded_amount||0),0);
   const expected=rows.reduce((s,r)=>{
     const allocated=Number(r.provider_fee||0)+Number(r.platform_amount||r.commission||0)+Number(r.vendor_amount||0)+Number(r.delivery_amount||0)+Number(r.refunded_amount||0);
     return s+(Number(r.amount||0)-allocated);
   },0);
   const paidPayouts=(payouts.data||[]).filter((r)=>r.status==="paid").reduce((s,r)=>s+Number(r.amount||0),0);
   let html='<div class="kpi-grid">'+
     reportKpi("Recebido bruto",money(gross))+reportKpi("Taxas do provedor",money(provider))+
     reportKpi("Receita Feiraê",money(platform))+reportKpi("Feirantes",money(vendors))+
     reportKpi("Entregadores",money(drivers))+reportKpi("Reembolsado",money(refunded))+
     reportKpi("Diferença a conciliar",money(expected))+reportKpi("Repasses pagos",money(paidPayouts))+
   '</div>';
   html+=miniTable("Conciliação por transação",["order_id","provider","method","status","amount","provider_fee","platform_amount","vendor_amount","delivery_amount","refunded_amount","reconciled","created_at"],rows);
   html+='<div class="notice"><b>Segurança financeira:</b> confirmar cobrança, estornar no provedor e liquidar repasses continuam sendo operações server-side. A Gestão consulta e marca conciliação; não usa chave secreta no navegador.</div>';
   $("#pageContent").innerHTML=html;
 }catch(e){renderError(e);}
}

async function renderAlerts(){
 $("#pageContent").innerHTML='<div class="empty">Verificando alertas operacionais…</div>';
 try{
   const settingR=await state.supabase.from("platform_settings").select("key,value").in("key",["alerts.order_stale_minutes","alerts.delivery_stale_minutes","alerts.document_expiry_days"]);
   const settings=Object.fromEntries((settingR.data||[]).map((r)=>[r.key,Number(r.value)]));
   const orderMinutes=settings["alerts.order_stale_minutes"]||45;
   const deliveryMinutes=settings["alerts.delivery_stale_minutes"]||30;
   const expiryDays=settings["alerts.document_expiry_days"]||30;
   const now=Date.now(),orderCut=new Date(now-orderMinutes*60000).toISOString(),deliveryCut=new Date(now-deliveryMinutes*60000).toISOString();
   const expiry=new Date(now+expiryDays*86400000).toISOString().slice(0,10);
   const empty={data:[],error:null};
   const [orders,deliveries,docs,payments,payouts,integrations]=await Promise.all([
     state.supabase.from("orders").select("id,status,total,updated_at,created_at").not("status","in","(delivered,canceled,refunded)").lt("updated_at",orderCut).order("updated_at"),
     state.supabase.from("deliveries").select("id,order_id,status,delivery_id,updated_at").not("status","in","(delivered,canceled)").lt("updated_at",deliveryCut).order("updated_at"),
     canModule("documents")?state.supabase.from("onboarding_documents").select("id,profile_id,document_type,status,expires_at").neq("status","rejected").lte("expires_at",expiry).order("expires_at"):Promise.resolve(empty),
     state.supabase.from("payments").select("id,order_id,status,amount,failure_reason,created_at").in("status",["failed","error","declined"]).order("created_at",{ascending:false}).limit(100),
     canModule("finance")?state.supabase.from("payouts").select("id,profile_id,status,amount,created_at").eq("status","failed").order("created_at",{ascending:false}).limit(100):Promise.resolve(empty),
     canModule("integration_health")?state.supabase.from("integration_registry").select("key,label,enabled,status,last_checked_at").eq("enabled",true).neq("status","ok"):Promise.resolve(empty)
   ]);
   const all=[orders,deliveries,docs,payments,payouts,integrations];const bad=all.find((x)=>x.error);if(bad)throw bad.error;
   const total=all.reduce((s,x)=>s+(x.data?.length||0),0);
   let html='<div class="kpi-grid">'+reportKpi("Alertas ativos",total)+reportKpi("Pedidos parados",orders.data.length)+reportKpi("Entregas paradas",deliveries.data.length)+reportKpi("Documentos vencendo",docs.data.length)+reportKpi("Falhas financeiras",payments.data.length+payouts.data.length)+reportKpi("Integrações",integrations.data.length)+'</div>';
   html+=miniTable("Pedidos sem atualização",["id","status","total","updated_at","created_at"],orders.data||[]);
   html+=miniTable("Entregas sem atualização",["id","order_id","status","delivery_id","updated_at"],deliveries.data||[]);
   html+=miniTable("Documentos vencidos ou próximos",["profile_id","document_type","status","expires_at"],docs.data||[]);
   html+=miniTable("Pagamentos com falha",["order_id","status","amount","failure_reason","created_at"],payments.data||[]);
   html+=miniTable("Repasses com falha",["profile_id","status","amount","created_at"],payouts.data||[]);
   html+=miniTable("Integrações com atenção",["key","label","status","last_checked_at"],integrations.data||[]);
   $("#pageContent").innerHTML=html;
 }catch(e){renderError(e);}
}

async function renderIntegrationHealth(){
 $("#pageContent").innerHTML='<div class="empty">Carregando saúde das integrações…</div>';
 try{
   const [registry,events]=await Promise.all([
     state.supabase.from("integration_registry").select("*").order("label"),
     state.supabase.from("integration_health_events").select("*").order("checked_at",{ascending:false}).limit(300)
   ]);
   if(registry.error)throw registry.error;if(events.error)throw events.error;
   const latest={};for(const e of events.data||[]){if(!latest[e.integration_key])latest[e.integration_key]=e;}
   const rows=(registry.data||[]).map((r)=>({...r,health_status:latest[r.key]?.status||r.status,health_message:latest[r.key]?.message||"",response_ms:latest[r.key]?.response_ms,checked_at:latest[r.key]?.checked_at||r.last_checked_at}));
   let html='<div class="notice"><b>Teste real:</b> health checks que dependem de credenciais devem ser executados no backend/Edge Function. Esta tela exibe o resultado recebido e nunca expõe segredo no navegador.</div>';
   html+=miniTable("Estado atual",["label","provider","environment","enabled","health_status","health_message","response_ms","checked_at"],rows);
   html+=miniTable("Histórico de verificações",["integration_key","status","message","response_ms","checked_at"],events.data||[]);
   $("#pageContent").innerHTML=html;
 }catch(e){renderError(e);}
}

const ADMIN_PERMISSION_SET=["*","operations.manage","documents.review","accounts.enforce","registrations.manage","rules.manage","finance.manage","communications.manage","settings.manage","permissions.manage","audit.view","reports.view"];

async function renderAdmins(){
 $("#pageContent").innerHTML='<div class="empty">Carregando administradores…</div>';
 try{
   const [profiles,candidates,access,permissions]=await Promise.all([
     state.supabase.from("profiles").select("id,full_name,phone,role,created_at").eq("role","admin").order("full_name"),
     state.supabase.from("profiles").select("id,full_name,role").neq("role","admin").order("full_name").limit(200),
     state.supabase.from("admin_access").select("*"),
     state.supabase.from("admin_permissions").select("*")
   ]);
   if(profiles.error)throw profiles.error;if(candidates.error)throw candidates.error;if(access.error)throw access.error;if(permissions.error)throw permissions.error;
   const accessMap=Object.fromEntries((access.data||[]).map((a)=>[a.profile_id,a]));
   const permMap=(permissions.data||[]).reduce((a,p)=>{(a[p.profile_id]??=[]).push(p.permission);return a;},{});
   let html='<section class="panel"><div class="panel-head"><div><h2>Administradores</h2><p>Ative/desative acessos e configure permissões sem compartilhar acesso total.</p></div></div>'+
   '<div class="admin-promote"><label>Adicionar administrador<select id="adminCandidate"><option value="">Selecione um usuário</option>'+
   (candidates.data||[]).map((u)=>'<option value="'+esc(u.id)+'">'+esc((u.full_name||"Sem nome")+" · "+u.role)+'</option>').join("")+
   '</select></label><button class="primary" id="promoteAdmin">Promover selecionado</button></div><div class="admin-list">';
   for(const p of profiles.data||[]){
     const ac=accessMap[p.id],active=ac?.active!==false,perms=permMap[p.id]||["* (acesso total enquanto não há regras explícitas)"];
     html+='<div class="admin-card"><div><strong>'+esc(p.full_name||p.id)+'</strong><small>'+esc(p.id)+'</small><div class="permission-chips">'+perms.map((x)=>'<span>'+esc(x)+'</span>').join("")+'</div></div><div class="actions"><span class="badge '+(active?"true":"false")+'">'+(active?"Ativo":"Desativado")+'</span><button data-admin-access="'+esc(p.id)+'" data-active="'+active+'">'+(active?"Desativar":"Ativar")+'</button><button data-admin-permissions="'+esc(p.id)+'">Permissões</button></div></div>';
   }
   html+='</div></section><div class="notice">Promover alguém a administrador altera um papel sensível e exige a permissão <code>permissions.manage</code>. O painel não cria contas do Auth nem envia convite usando service role.</div>';
   $("#pageContent").innerHTML=html;
   $("#promoteAdmin").onclick=promoteExistingAdmin;
   document.querySelectorAll("[data-admin-access]").forEach((b)=>b.onclick=()=>setAdminAccess(b.dataset.adminAccess,b.dataset.active!=="true"));
   document.querySelectorAll("[data-admin-permissions]").forEach((b)=>b.onclick=()=>editAdminPermissions(b.dataset.adminPermissions,permMap[b.dataset.adminPermissions]||[]));
 }catch(e){renderError(e);}
}

async function promoteExistingAdmin(){
 const id=$("#adminCandidate")?.value;
 if(!id){toast("Selecione um usuário.");return;}
 const r=await state.supabase.from("profiles").update({role:"admin"}).eq("id",id).select("id,full_name").maybeSingle();
 if(r.error){toast(r.error.message);return;}
 if(!r.data){toast("Usuário não encontrado.");return;}
 const a=await state.supabase.from("admin_access").upsert({profile_id:id,active:true,updated_by:state.session.user.id},{onConflict:"profile_id"});
 if(a.error){toast(a.error.message);return;}
 await audit("promote_admin","profiles",id,null,{role:"admin"});
 toast("Administrador promovido.");
 await renderAdmins();
}

async function setAdminAccess(profileId,active){
 if(profileId===state.session.user.id&&!active){toast("Você não pode desativar seu próprio acesso nesta sessão.");return;}
 const r=await state.supabase.from("admin_access").upsert({profile_id:profileId,active,updated_by:state.session.user.id,updated_at:new Date().toISOString()},{onConflict:"profile_id"});
 if(r.error){toast(r.error.message);return;}
 await audit(active?"admin_enable":"admin_disable","admin_access",profileId,null,{active});
 toast(active?"Acesso ativado.":"Acesso desativado.");
 await renderAdmins();
}

function editAdminPermissions(profileId,current){
 state.editing={special:"admin_permissions",profileId};
 $("#modalTitle").textContent="Permissões administrativas";
 $("#editorForm").innerHTML='<div class="full-span permission-editor"><p>Marque as áreas permitidas. Sem nenhuma permissão explícita, o administrador mantém acesso total por compatibilidade de bootstrap.</p>'+
 ADMIN_PERMISSION_SET.map((p)=>'<label class="check-row"><input type="checkbox" data-admin-perm="'+esc(p)+'" '+(current.includes(p)?"checked":"")+'><span>'+esc(p)+'</span></label>').join("")+'</div>';
 $("#modal").classList.remove("hidden");
}

async function saveAdminPermissions(){
 const id=state.editing.profileId;
 const selected=[...$("#editorForm").querySelectorAll("[data-admin-perm]:checked")].map((x)=>x.dataset.adminPerm);
 const del=await state.supabase.from("admin_permissions").delete().eq("profile_id",id);
 if(del.error){toast(del.error.message);return false;}
 if(selected.length){
   const ins=await state.supabase.from("admin_permissions").insert(selected.map((permission)=>({profile_id:id,permission,granted_by:state.session.user.id})));
   if(ins.error){toast(ins.error.message);return false;}
 }
 await audit("permissions_replace","admin_permissions",id,null,{permissions:selected});
 return true;
}

async function renderAuditAdvanced(){
 $("#pageContent").innerHTML=
 '<section class="panel"><div class="panel-head"><div><h2>Auditoria</h2><p>Filtre alterações por administrador, entidade, ação e período.</p></div></div><div class="report-filters">'+
 '<label>Administrador<input id="auditAdmin" placeholder="UUID"></label><label>Entidade<input id="auditEntity" placeholder="orders, fairs…"></label>'+
 '<label>Ação<input id="auditAction" placeholder="update, insert…"></label><label>De<input id="auditFrom" type="date"></label><label>Até<input id="auditTo" type="date"></label>'+
 '<div class="report-actions"><button id="runAudit" class="primary">Filtrar</button></div></div></section><div id="auditResult"></div>';
 $("#runAudit").onclick=loadAuditAdvanced;
 await loadAuditAdvanced();
}

async function loadAuditAdvanced(){
 let q=state.supabase.from("admin_audit_logs").select("*").order("created_at",{ascending:false}).limit(1000);
 const admin=$("#auditAdmin")?.value.trim(),entity=$("#auditEntity")?.value.trim(),action=$("#auditAction")?.value.trim(),from=$("#auditFrom")?.value,to=$("#auditTo")?.value;
 if(admin)q=q.eq("admin_id",admin);if(entity)q=q.ilike("entity","%"+entity+"%");if(action)q=q.ilike("action","%"+action+"%");
 if(from)q=q.gte("created_at",from+"T00:00:00");if(to)q=q.lte("created_at",to+"T23:59:59.999");
 const r=await q;
 if(r.error){$("#auditResult").innerHTML='<div class="notice">'+esc(r.error.message)+'</div>';return;}
 $("#auditResult").innerHTML=miniTable("Eventos de auditoria",["created_at","admin_id","action","entity","entity_id","before_data","after_data"],r.data||[]);
}

async function renderSettings(){
 $("#pageContent").innerHTML='<div class="empty">Carregando configurações…</div>';
 const r=await state.supabase.from("platform_settings").select("*").order("category").order("label");
 if(r.error){renderError(r.error);return;}
 const grouped=(r.data||[]).reduce((a,row)=>{(a[row.category]??=[]).push(row);return a;},{});
 let html='<div class="notice"><b>Configuração sem código:</b> não use esta área para senhas, tokens ou chaves secretas.</div>';
 for(const [cat,rows] of Object.entries(grouped)){
   html+='<section class="panel"><div class="panel-head"><div><h2>'+esc(title(cat))+'</h2><p>'+rows.length+' parâmetros</p></div></div><div class="config-grid" style="padding:16px">';
   html+=rows.map(settingCard).join("");
   html+='</div></section>';
 }
 $("#pageContent").innerHTML=html;
 document.querySelectorAll("[data-save-setting]").forEach((b)=>b.onclick=()=>saveSetting(b.dataset.saveSetting));
}

function settingCard(r){
 const v=r.value,bool=typeof v==="boolean",primitive=["string","number","boolean"].includes(typeof v);
 let input;
 if(bool)input='<select data-setting-value="'+esc(r.key)+'"><option value="true" '+(v?"selected":"")+'>Ativado</option><option value="false" '+(!v?"selected":"")+'>Desativado</option></select>';
 else input='<input data-setting-value="'+esc(r.key)+'" value="'+esc(primitive?v:JSON.stringify(v))+'">';
 return '<div class="config-card"><h3>'+esc(r.label)+'</h3><p>'+esc(r.description||r.key)+'</p><div class="value-row">'+input+'<button class="secondary" data-save-setting="'+esc(r.key)+'">Salvar</button></div></div>';
}

async function saveSetting(key){
 const input=document.querySelector('[data-setting-value="'+CSS.escape(key)+'"]');
 const cur=await state.supabase.from("platform_settings").select("value").eq("key",key).single();
 let v=input.value,old=cur.data?.value;
 if(typeof old==="boolean")v=v==="true";
 else if(typeof old==="number")v=Number(v);
 else if(old&&typeof old==="object"){try{v=JSON.parse(v);}catch{toast("JSON inválido");return;}}
 const r=await state.supabase.from("platform_settings").update({value:v,updated_by:state.session.user.id,updated_at:new Date().toISOString()}).eq("key",key);
 toast(r.error?r.error.message:"Configuração salva.");
}

async function renderModule(m){
 $("#pageContent").innerHTML='<div class="empty">Carregando '+esc(m.label.toLowerCase())+'…</div>';
 const from=state.page*state.pageSize,to=from+state.pageSize-1;
 let q=state.supabase.from(m.table).select("*",{count:"exact"}).range(from,to);
 const term=safeSearchTerm(state.query);
 const searchFields=TABLE_SEARCH_FIELDS[m.table]||[];
 const filters=[];
 if(term){
   for(const field of searchFields)filters.push(field+".ilike.*"+term+"*");
   if(isUuid(term))filters.push((m.key||"id")+".eq."+term);
   if(filters.length)q=q.or(filters.join(","));
 }
 if(m.cols.includes("created_at"))q=q.order("created_at",{ascending:false});
 else if(m.cols.includes("updated_at"))q=q.order("updated_at",{ascending:false});
 else if(m.cols.includes("name"))q=q.order("name");
 const r=await q;if(r.error){renderError(r.error);return;}
 state.rows=r.data||[];state.total=r.count||0;
 if(!state.rows.length&&state.page>0){state.page--;return renderModule(m);}
 drawTable(m,state.rows);
}

function drawTable(m,rows){
 const start=state.total?state.page*state.pageSize+1:0;
 const end=Math.min((state.page+1)*state.pageSize,state.total);
 let html='<section class="panel"><div class="panel-head"><div><h2>'+esc(m.label)+'</h2><p>'+esc(m.desc)+'</p></div><div class="toolbar"><input id="tableSearch" value="'+esc(state.query)+'" placeholder="Buscar no banco">';
 if(m.bulkField)html+='<button id="bulkEnable" class="secondary">Ativar selecionados</button><button id="bulkDisable" class="secondary">Desativar selecionados</button>';
 if(m.create)html+='<button id="newRecord" class="primary">Novo</button>';
 html+='</div></div><div class="table-wrap"><table><thead><tr>';
 if(m.bulkField)html+='<th><input id="selectAllRows" type="checkbox" aria-label="Selecionar todos"></th>';
 html+=m.cols.map((c)=>'<th>'+esc(label(c))+'</th>').join("");
 if(!m.readonly)html+='<th>Ações</th>';
 html+='</tr></thead><tbody id="tableBody"></tbody></table></div>'+
 '<div class="pagination"><span>'+start+'–'+end+' de '+state.total+'</span><div><button id="prevPage" class="secondary" '+(state.page===0?"disabled":"")+'>Anterior</button><button id="nextPage" class="secondary" '+(end>=state.total?"disabled":"")+'>Próxima</button></div></div></section>';
 $("#pageContent").innerHTML=html;
 fillRows(m,rows);
 let searchTimer;
 $("#tableSearch").oninput=(e)=>{
   clearTimeout(searchTimer);
   searchTimer=setTimeout(async()=>{state.query=e.target.value;state.page=0;state.selected=new Set();await renderModule(m);},300);
 };
 $("#prevPage").onclick=async()=>{if(state.page>0){state.page--;state.selected=new Set();await renderModule(m);}};
 $("#nextPage").onclick=async()=>{if((state.page+1)*state.pageSize<state.total){state.page++;state.selected=new Set();await renderModule(m);}};
 if(m.create)$("#newRecord").onclick=()=>m.secureAction==="enforcement"?openEnforcementCreate():openEditor(m,null);
 if(m.bulkField){
   $("#bulkEnable").onclick=()=>bulkSet(m,true);
   $("#bulkDisable").onclick=()=>bulkSet(m,false);
   $("#selectAllRows").onchange=(e)=>{
     state.selected=new Set(e.target.checked?state.rows.map((r)=>String(r[m.key||"id"])):[]);
     fillRows(m,state.rows);
   };
 }
}

function fillRows(m,rows){
 const body=$("#tableBody");
 const extra=m.bulkField?1:0;
 if(!rows.length){body.innerHTML='<tr><td colspan="'+(m.cols.length+(m.readonly?0:1)+extra)+'" class="empty">Nenhum registro encontrado.</td></tr>';return;}
 body.innerHTML=rows.map((row,i)=>{
   const key=String(row[m.key||"id"]??"");
   let line='<tr>';
   if(m.bulkField)line+='<td><input type="checkbox" data-select-row="'+i+'" '+(state.selected.has(key)?"checked":"")+'></td>';
   line+=m.cols.map((c)=>'<td>'+cell(c,row[c])+'</td>').join("");
   if(!m.readonly){
     line+='<td><div class="actions">';
     if(m.table==="orders")line+='<button data-order-detail="'+i+'">Detalhes</button>';
     if(m.table==="deliveries")line+='<button data-delivery-detail="'+i+'">Detalhes</button>';
     if(m.profileDetail)line+='<button data-profile-detail="'+i+'">Visão 360°</button>';
     if(m.secureAction==="document_review")line+='<button data-document-review="'+i+'">Revisar</button>';
     if(m.secureAction==="support_update")line+='<button data-support-update="'+i+'">Atender</button>';
     if(m.secureAction==="payment_reconcile")line+='<button data-payment-reconcile="'+i+'">'+(row.reconciled?"Desconciliar":"Conciliar")+'</button>';
     if(m.secureAction==="review_moderate")line+='<button data-review-moderate="'+i+'">Moderar</button>';
     if(m.secureAction==="privacy_update")line+='<button data-privacy-update="'+i+'">Tratar</button>';
     if(m.secureAction==="enforcement"&&row.status==="active")line+='<button data-enforcement-revoke="'+i+'">Revogar</button>';
     if(m.fields?.length)line+='<button data-edit="'+i+'">Editar</button>';
     if(m.documentViewer&&row.file_path)line+='<button data-document="'+i+'">Abrir documento</button>';
     if(m.enforcementTarget&&canModule("enforcements")){
       line+='<button data-suspend="'+i+'">Suspender</button><button data-ban="'+i+'">Banir</button>';
       if(m.table==="delivery_profiles")line+='<button data-block-delivery="'+i+'">Bloquear entregas</button>';
     }
     if(m.del!==false)line+='<button data-delete="'+i+'">Excluir</button>';
     line+='</div></td>';
   }
   return line+'</tr>';
 }).join("");
 body.querySelectorAll("[data-select-row]").forEach((b)=>b.onchange=()=>{
   const row=rows[Number(b.dataset.selectRow)],key=String(row[m.key||"id"]);
   if(b.checked)state.selected.add(key);else state.selected.delete(key);
 });
 body.querySelectorAll("[data-order-detail]").forEach((b)=>b.onclick=()=>renderOrderDetail(rows[Number(b.dataset.orderDetail)].id));
 body.querySelectorAll("[data-delivery-detail]").forEach((b)=>b.onclick=()=>renderDeliveryDetail(rows[Number(b.dataset.deliveryDetail)].id));
 body.querySelectorAll("[data-profile-detail]").forEach((b)=>b.onclick=()=>renderProfile360(m.profileDetail,rows[Number(b.dataset.profileDetail)]));
 body.querySelectorAll("[data-document-review]").forEach((b)=>b.onclick=()=>openDocumentReview(rows[Number(b.dataset.documentReview)]));
 body.querySelectorAll("[data-support-update]").forEach((b)=>b.onclick=()=>openSupportUpdate(rows[Number(b.dataset.supportUpdate)]));
 body.querySelectorAll("[data-payment-reconcile]").forEach((b)=>b.onclick=()=>togglePaymentReconcile(rows[Number(b.dataset.paymentReconcile)]));
 body.querySelectorAll("[data-review-moderate]").forEach((b)=>b.onclick=()=>openReviewModeration(rows[Number(b.dataset.reviewModerate)]));
 body.querySelectorAll("[data-privacy-update]").forEach((b)=>b.onclick=()=>openPrivacyUpdate(rows[Number(b.dataset.privacyUpdate)]));
 body.querySelectorAll("[data-enforcement-revoke]").forEach((b)=>b.onclick=()=>revokeEnforcement(rows[Number(b.dataset.enforcementRevoke)]));
 body.querySelectorAll("[data-edit]").forEach((b)=>b.onclick=()=>openEditor(m,rows[Number(b.dataset.edit)]));
 body.querySelectorAll("[data-document]").forEach((b)=>b.onclick=()=>openDocument(rows[Number(b.dataset.document)]));
 body.querySelectorAll("[data-suspend]").forEach((b)=>b.onclick=()=>openEnforcement(rows[Number(b.dataset.suspend)].id,"suspension"));
 body.querySelectorAll("[data-ban]").forEach((b)=>b.onclick=()=>openEnforcement(rows[Number(b.dataset.ban)].id,"ban"));
 body.querySelectorAll("[data-block-delivery]").forEach((b)=>b.onclick=()=>openEnforcement(rows[Number(b.dataset.blockDelivery)].id,"deliveries_block"));
 body.querySelectorAll("[data-delete]").forEach((b)=>b.onclick=()=>removeRow(m,rows[Number(b.dataset.delete)]));
}

async function bulkSet(m,value){
 if(!m.bulkField||!state.selected.size){toast("Selecione pelo menos um registro.");return;}
 const key=m.key||"id";
 const ids=[...state.selected];
 let q=state.supabase.from(m.table).update({[m.bulkField]:value});
 q=ids.length===1?q.eq(key,ids[0]):q.in(key,ids);
 const r=await q;
 if(r.error){toast(r.error.message);return;}
 await audit("bulk_update",m.table,ids.join(","),null,{field:m.bulkField,value,count:ids.length});
 toast(ids.length+" registros atualizados.");
 state.selected=new Set();
 await openModule(state.active);
}

async function openDocument(row){
 const path=row?.file_path;
 if(!path){toast("Este cadastro não possui arquivo enviado.");return;}
 if(/^https?:\/\//i.test(path)){window.open(path,"_blank","noopener,noreferrer");return;}
 const popup=window.open("about:blank","_blank");
 const setting=await state.supabase.from("platform_settings").select("value").eq("key","documents.storage_bucket").maybeSingle();
 const bucket=typeof setting.data?.value==="string"?setting.data.value:"onboarding-documents";
 const signed=await state.supabase.storage.from(bucket).createSignedUrl(path,300);
 if(signed.error){
   if(popup)popup.close();
   toast("Não foi possível abrir o documento: "+signed.error.message);
   return;
 }
 if(popup)popup.location.href=signed.data.signedUrl;
 else window.open(signed.data.signedUrl,"_blank","noopener,noreferrer");
}

function openEditor(m,row,forceCreate=false){
 const isNew=forceCreate||!row;
 state.editing={m,row,isNew};
 $("#modalTitle").textContent=isNew?"Novo em "+m.label:"Editar "+m.label;
 $("#editorForm").innerHTML=m.fields.map((field)=>renderField(field,row?.[field.key])).join("");
 $("#modal").classList.remove("hidden");
}

function renderField(field,v){
 const id="f-"+field.key;
 if(field.type==="checkbox")return '<label class="check-row"><input id="'+id+'" data-field="'+field.key+'" type="checkbox" '+(v?"checked":"")+'><span>'+esc(field.label)+'</span></label>';
 if(field.type==="select"){
   return '<label>'+esc(field.label)+'<select id="'+id+'" data-field="'+field.key+'" data-type="select"><option value="">Selecione</option>'+
     (field.options||[]).map((o)=>'<option value="'+esc(o)+'" '+(String(v??"")===String(o)?"selected":"")+'>'+esc(o)+'</option>').join("")+
     '</select></label>';
 }
 if(field.type==="textarea"||field.type==="json"){
   const value=field.type==="json"&&v&&typeof v==="object"?JSON.stringify(v,null,2):(v??"");
   return '<label class="full-span">'+esc(field.label)+'<textarea id="'+id+'" data-field="'+field.key+'" data-type="'+field.type+'" rows="4">'+esc(value)+'</textarea></label>';
 }
 const type=field.type==="number"?"number":field.type==="date"?"date":field.type==="datetime"?"datetime-local":"text";
 let value=v??"";if(field.type==="datetime"&&v)value=new Date(v).toISOString().slice(0,16);
 return '<label>'+esc(field.label)+'<input id="'+id+'" data-field="'+field.key+'" data-type="'+field.type+'" type="'+type+'" '+(field.type==="number"?'step="any"':"")+' value="'+esc(value)+'"></label>';
}

function readPayload(){
 const out={};
 $("#editorForm").querySelectorAll("[data-field]").forEach((input)=>{
   const k=input.dataset.field,t=input.dataset.type||(input.type==="checkbox"?"checkbox":"text");
   if(t==="checkbox")out[k]=input.checked;
   else if(input.value==="")out[k]=null;
   else if(t==="number")out[k]=Number(input.value);
   else if(t==="json")out[k]=JSON.parse(input.value);
   else if(t==="datetime")out[k]=new Date(input.value).toISOString();
   else out[k]=input.value;
 });
 return out;
}

async function saveEditor(){
 if(!state.editing)return;
 if(state.editing.special==="stall"){
   $("#saveEdit").disabled=true;
   const ok=await saveStallEditor();
   $("#saveEdit").disabled=false;
   if(ok){closeEditor();toast("Banca/box salva.");await renderStalls();}
   return;
 }
 if(state.editing.special==="admin_permissions"){
   $("#saveEdit").disabled=true;
   const ok=await saveAdminPermissions();
   $("#saveEdit").disabled=false;
   if(ok){closeEditor();toast("Permissões atualizadas.");await renderAdmins();}
   return;
 }
 const {m,row,isNew}=state.editing;let payload;
 try{payload=readPayload();}catch{toast("JSON inválido");return;}
 if(m.table==="account_enforcements"&&payload.action_type==="suspension"&&!payload.ends_at){
   toast("Informe até quando a suspensão ficará ativa.");
   return;
 }
 if(m.table==="account_enforcements"&&payload.ends_at&&payload.starts_at&&new Date(payload.ends_at)<=new Date(payload.starts_at)){
   toast("A data final precisa ser posterior ao início.");
   return;
 }
 if(m.table==="payments"){
   payload.reconciled_by=payload.reconciled?state.session.user.id:null;
   payload.reconciled_at=payload.reconciled?new Date().toISOString():null;
 }
 $("#saveEdit").disabled=true;
 const key=m.key||"id";
 let r;
 if(isNew){
   r=await state.supabase.from(m.table).insert(payload).select().single();
 }else{
   r=await state.supabase.from(m.table).update(payload).eq(key,row[key]).select().single();
 }
 $("#saveEdit").disabled=false;
 if(r.error){toast(r.error.message);return;}
 if(m.audit)await audit(isNew?"insert":"update",m.table,String(r.data?.[key]||""),isNew?null:row,r.data);
 closeEditor();toast("Alteração salva.");await openModule(state.active);
}

async function removeRow(m,row){
 if(!confirm("Excluir este registro de "+m.label+"?"))return;
 const key=m.key||"id";
 const r=await state.supabase.from(m.table).delete().eq(key,row[key]);
 if(r.error){toast(r.error.message);return;}
 if(m.audit)await audit("delete",m.table,String(row[key]||""),row,null);
 toast("Registro excluído.");await openModule(state.active);
}

async function audit(action,entity,entityId,beforeData,afterData){
 try{
   await state.supabase.from("admin_audit_logs").insert({
     admin_id:state.session.user.id,action,entity,entity_id:entityId,before_data:beforeData,after_data:afterData
   });
 }catch{}
}

function closeEditor(){state.editing=null;$("#modal").classList.add("hidden");$("#editorForm").innerHTML="";}
function renderError(e){$("#pageContent").innerHTML='<div class="notice"><b>Não foi possível carregar esta área.</b><br>'+esc(e.message||String(e))+'<br><br>Confirme a migration <code>0003_management_console.sql</code> e o papel <code>admin</code>.</div>';}

$("#setupForm").onsubmit=(e)=>{
 e.preventDefault();
 const c={url:$("#supabaseUrl").value.trim(),anonKey:$("#supabaseAnonKey").value.trim()};
 localStorage.setItem(CONFIG_KEY,JSON.stringify(c));configure(c);show("loginView");
};
$("#loginForm").onsubmit=async(e)=>{
 e.preventDefault();loginError("");
 const r=await state.supabase.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});
 if(r.error){loginError(r.error.message);return;}
 const result=await acceptSession(r.data.session);
 if(result==="denied")show("loginView");
};
$("#mfaForm").onsubmit=async(e)=>{
 e.preventDefault();
 const code=$("#mfaCode").value.trim();
 if(!state.mfaFactorId||!code)return;
 $("#mfaError").classList.add("hidden");
 const verified=await state.supabase.auth.mfa.challengeAndVerify({factorId:state.mfaFactorId,code});
 if(verified.error){
   $("#mfaError").textContent=verified.error.message;
   $("#mfaError").classList.remove("hidden");
   return;
 }
 $("#mfaCode").value="";
 $("#mfaEnrollment").classList.add("hidden");
 const session=(await state.supabase.auth.getSession()).data.session;
 if(session)await acceptSession(session);
};
$("#mfaCancel").onclick=async()=>{await state.supabase.auth.signOut();state.mfaFactorId=null;show("loginView");};
$("#logoutBtn").onclick=async()=>{await state.supabase.auth.signOut();state.profile=null;show("loginView");};
$("#refreshBtn").onclick=()=>openModule(state.active);
$("#menuBtn").onclick=()=>$("#appView").classList.toggle("menu-open");
$("#closeModal").onclick=closeEditor;
$("#cancelEdit").onclick=closeEditor;
$("#saveEdit").onclick=saveEditor;
$("#modal").onclick=(e)=>{if(e.target.id==="modal")closeEditor();};

boot().catch((e)=>{console.error(e);show("loginView");loginError("Falha ao iniciar. Verifique a conexão com o Supabase.");});
