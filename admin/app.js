import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { navGroups, modules } from "./modules.js";

const CONFIG_KEY="feirae:management:supabase";
const $=(s)=>document.querySelector(s);
const state={supabase:null,session:null,profile:null,active:"dashboard",rows:[],editing:null};

function show(id){["boot","setupView","loginView","appView"].forEach((x)=>$("#"+x).classList.toggle("hidden",x!==id));}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.remove("hidden");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add("hidden"),3000);}
function loginError(msg){$("#loginError").textContent=msg;$("#loginError").classList.toggle("hidden",!msg);}
function title(v){return String(v).replace(/(^|\s)\S/g,(m)=>m.toUpperCase());}
function money(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):esc(v);}
function date(v){if(!v)return "—";const d=new Date(v);return Number.isNaN(d.getTime())?esc(v):d.toLocaleString("pt-BR");}

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
 admin_id:"Admin",action:"Ação",entity:"Entidade",entity_id:"Registro"
};
function label(k){return labels[k]||title(k.replaceAll("_"," "));}

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
 if(!(await acceptSession(session)))show("loginView");
}

async function acceptSession(session){
 state.session=session;
 const r=await state.supabase.from("profiles").select("id,full_name,role").eq("id",session.user.id).maybeSingle();
 if(r.error||!r.data||r.data.role!=="admin"){
   await state.supabase.auth.signOut();
   loginError(r.error?.message||"Esta conta não possui papel admin.");
   return false;
 }
 state.profile=r.data;
 renderNav();
 $("#adminIdentity").textContent=r.data.full_name||session.user.email;
 show("appView");
 await openModule("dashboard");
 return true;
}

function renderNav(){
 $("#nav").innerHTML=navGroups.map((group)=>{
   const name=group[0],items=group[1];
   return '<div class="nav-group"><div class="nav-group-title">'+esc(name)+'</div>'+
     items.map((it)=>'<button class="nav-item" data-module="'+esc(it[0])+'">'+esc(it[1])+'</button>').join("")+
     '</div>';
 }).join("");
 document.querySelectorAll("[data-module]").forEach((b)=>b.onclick=()=>openModule(b.dataset.module));
}

async function openModule(id){
 state.active=id;state.rows=[];
 document.querySelectorAll(".nav-item").forEach((b)=>b.classList.toggle("active",b.dataset.module===id));
 $("#appView").classList.remove("menu-open");
 if(id==="dashboard"){ $("#pageTitle").textContent="Visão geral";$("#breadcrumb").textContent="Operação";await renderDashboard();return; }
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
 let q=state.supabase.from(m.table).select("*").limit(300);
 if(m.cols.includes("created_at"))q=q.order("created_at",{ascending:false});
 else if(m.cols.includes("updated_at"))q=q.order("updated_at",{ascending:false});
 const r=await q;if(r.error){renderError(r.error);return;}
 state.rows=r.data||[];drawTable(m,state.rows);
}

function drawTable(m,rows){
 let html='<section class="panel"><div class="panel-head"><div><h2>'+esc(m.label)+'</h2><p>'+esc(m.desc)+'</p></div><div class="toolbar"><input id="tableSearch" placeholder="Buscar nesta lista">';
 if(m.create)html+='<button id="newRecord" class="primary">Novo</button>';
 html+='</div></div><div class="table-wrap"><table><thead><tr>'+m.cols.map((c)=>'<th>'+esc(label(c))+'</th>').join("");
 if(!m.readonly)html+='<th>Ações</th>';
 html+='</tr></thead><tbody id="tableBody"></tbody></table></div></section>';
 $("#pageContent").innerHTML=html;
 fillRows(m,rows);
 $("#tableSearch").oninput=(e)=>{const t=e.target.value.toLowerCase().trim();fillRows(m,!t?state.rows:state.rows.filter((r)=>JSON.stringify(r).toLowerCase().includes(t)));};
 if(m.create)$("#newRecord").onclick=()=>openEditor(m,null);
}

function fillRows(m,rows){
 const body=$("#tableBody");
 if(!rows.length){body.innerHTML='<tr><td colspan="'+(m.cols.length+1)+'" class="empty">Nenhum registro encontrado.</td></tr>';return;}
 body.innerHTML=rows.map((row,i)=>{
   let line='<tr>'+m.cols.map((c)=>'<td>'+cell(c,row[c])+'</td>').join("");
   if(!m.readonly){
     line+='<td><div class="actions"><button data-edit="'+i+'">Editar</button>';
     if(m.del!==false)line+='<button data-delete="'+i+'">Excluir</button>';
     line+='</div></td>';
   }
   return line+'</tr>';
 }).join("");
 body.querySelectorAll("[data-edit]").forEach((b)=>b.onclick=()=>openEditor(m,rows[Number(b.dataset.edit)]));
 body.querySelectorAll("[data-delete]").forEach((b)=>b.onclick=()=>removeRow(m,rows[Number(b.dataset.delete)]));
}

function openEditor(m,row){
 state.editing={m,row};
 $("#modalTitle").textContent=row?"Editar "+m.label:"Novo em "+m.label;
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
 const {m,row}=state.editing;let payload;
 try{payload=readPayload();}catch{toast("JSON inválido");return;}
 $("#saveEdit").disabled=true;
 const key=m.key||"id";
 const r=row
   ? await state.supabase.from(m.table).update(payload).eq(key,row[key]).select().single()
   : await state.supabase.from(m.table).insert(payload).select().single();
 $("#saveEdit").disabled=false;
 if(r.error){toast(r.error.message);return;}
 if(m.audit)await audit(row?"update":"insert",m.table,String(r.data?.[key]||""),row,r.data);
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
 if(!(await acceptSession(r.data.session)))show("loginView");
};
$("#changeConnection").onclick=()=>{localStorage.removeItem(CONFIG_KEY);show("setupView");};
$("#logoutBtn").onclick=async()=>{await state.supabase.auth.signOut();state.profile=null;show("loginView");};
$("#refreshBtn").onclick=()=>openModule(state.active);
$("#menuBtn").onclick=()=>$("#appView").classList.toggle("menu-open");
$("#closeModal").onclick=closeEditor;
$("#cancelEdit").onclick=closeEditor;
$("#saveEdit").onclick=saveEditor;
$("#modal").onclick=(e)=>{if(e.target.id==="modal")closeEditor();};

boot().catch((e)=>{console.error(e);show("loginView");loginError("Falha ao iniciar. Verifique a conexão com o Supabase.");});
