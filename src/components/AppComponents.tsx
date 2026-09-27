import { FormEvent, ReactNode, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bike,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  FileCheck2,
  FileSignature,
  Home,
  LocateFixed,
  LogOut,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  User,
  X,
} from "lucide-react";
import { fairs } from "../data";
import type { CustomerTab, Product, Role } from "../types";
import { money } from "../utils";
import { cartWeight, productWeight } from "../domain/marketplace";
import {
  DEFAULT_VENDOR_MINIMUM_ORDER_AMOUNT,
  normalizeVendorMinimumOrder,
  vendorOrderSummaries,
} from "../domain/multiVendor";
import { readStoreByIdentity } from "../domain/marketplaceBridge";
import type { LegalAcceptance, LegalTerm } from "../domain/legalTerms";
import {
  customerPrivacyNotice,
  customerTermsOfUse,
  saveCustomerLegalAcceptances,
} from "../domain/customerLegal";

const roleLabels: Record<Role, string> = {
  customer: "Cliente",
  feirante: "Feirante",
  delivery: "Entregador",
};

export function LoginPage({
  onLogin,
}: {
  onLogin: (
    role: Role,
    email: string,
    name: string,
    password: string,
    isNewAccount: boolean,
  ) => string | null;
}) {
  const [selectedRole, setSelectedRole] = useState<Role>("customer");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedCustomerTerms, setAcceptedCustomerTerms] = useState(false);
  const [acknowledgedCustomerPrivacy, setAcknowledgedCustomerPrivacy] = useState(false);
  const [customerOffersOptIn, setCustomerOffersOptIn] = useState(false);
  const [formError, setFormError] = useState("");
  const options: Array<{ role: Role; title: string; text: string; icon: ReactNode }> = [
    {
      role: "customer",
      title: "Cliente",
      text: "Comprar produtos e acompanhar pedidos",
      icon: <ShoppingBag />,
    },
    {
      role: "feirante",
      title: "Feirante",
      text: "Gerenciar sua banca, produtos e vendas",
      icon: <Store />,
    },
    {
      role: "delivery",
      title: "Entregador",
      text: "Aceitar entregas, rotas e acompanhar ganhos",
      icon: <Bike />,
    },
  ];

  function clearFormError() {
    if (formError) setFormError("");
  }

  function resetCustomerLegalChoice() {
    setAcceptedCustomerTerms(false);
    setAcknowledgedCustomerPrivacy(false);
    setCustomerOffersOptIn(false);
  }

  function changeMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    setFormError("");
    if (nextMode === "login") resetCustomerLegalChoice();
  }

  function changeRole(nextRole: Role) {
    setSelectedRole(nextRole);
    setFormError("");
    resetCustomerLegalChoice();
  }

  function submit(event: FormEvent) {
    event.preventDefault();

    if (
      mode === "signup" &&
      selectedRole === "customer" &&
      (!acceptedCustomerTerms || !acknowledgedCustomerPrivacy)
    ) {
      setFormError("Para criar a conta, leia e confirme os Termos de Uso e o Aviso de Privacidade.");
      return;
    }

    const normalizedEmail = email.trim();
    const normalizedName = name.trim();
    const error = onLogin(selectedRole, normalizedEmail, normalizedName, password, mode === "signup");

    if (!error && mode === "signup" && selectedRole === "customer") {
      saveCustomerLegalAcceptances(normalizedName, normalizedEmail);
      window.localStorage.setItem(
        `feirae:offers:${normalizedEmail.toLocaleLowerCase("pt-BR")}`,
        JSON.stringify(customerOffersOptIn),
      );
    }

    setFormError(error ?? "");
  }

  return (
    <main className={`login-page auth-mode-${mode}`}>
      <section className="login-showcase">
        <div className="login-brand">
          <span className="brand-mark">ê</span>
          <b>
            Feiraê<span>.</span>
          </b>
        </div>
        <div>
          <span className="eyebrow light">A feira do seu jeito</span>
          <h1>Da banca até você.</h1>
          <p>Compre de feirantes locais, gerencie sua banca ou faça entregas. Tudo pelo Feiraê.</p>
        </div>
        <div className="login-benefits">
          <span>Produtos locais</span>
          <span>Feiras do DF</span>
          <span>Entrega e retirada</span>
        </div>
      </section>
      <section className="login-content">
        <div className="login-form-wrap">
          <span className="eyebrow">Acesso ao Feiraê</span>
          <div className="auth-switch" role="tablist" aria-label="Entrar ou criar conta">
            <button
              className={mode === "login" ? "active" : ""}
              type="button"
              onClick={() => changeMode("login")}
            >
              Entrar
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              type="button"
              onClick={() => changeMode("signup")}
            >
              Criar conta
            </button>
          </div>
          <h2>{mode === "login" ? "Como você vai usar o aplicativo?" : "Crie sua conta no Feiraê"}</h2>
          <p className="login-intro">
            {mode === "login"
              ? "Escolha seu tipo de acesso. As telas serão preparadas para essa função."
              : "Cliente entra rápido. Feirante e entregador passam por cadastro, documentos e validação."}
          </p>
          <div className="role-options" role="radiogroup" aria-label="Tipo de acesso">
            {options.map((option) => (
              <button
                type="button"
                role="radio"
                aria-checked={selectedRole === option.role}
                key={option.role}
                onClick={() => changeRole(option.role)}
                className={selectedRole === option.role ? "selected" : ""}
              >
                <span>{option.icon}</span>
                <span>
                  <b>{option.title}</b>
                  <small>{option.text}</small>
                </span>
                <i>{selectedRole === option.role && <Check size={15} />}</i>
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="login-form">
            {mode === "signup" && (
              <label>
                Nome completo
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    clearFormError();
                  }}
                  placeholder="Seu nome"
                  autoComplete="name"
                  required
                />
              </label>
            )}
            <label>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFormError();
                }}
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="password-field">
              Senha
              <span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearFormError();
                  }}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {mode === "signup" && selectedRole === "customer" && (
              <section className="customer-signup-legal" aria-label="Termos para criar conta de Cliente">
                <div className="customer-signup-legal-heading">
                  <img src="/feirae-mark.svg" alt="" aria-hidden="true" />
                  <div>
                    <b>Antes de criar sua conta</b>
                    <span>Leia os documentos e confirme somente o que você concorda.</span>
                  </div>
                </div>

                {[customerTermsOfUse, customerPrivacyNotice].map((term) => (
                  <details className="customer-legal-details" key={term.id}>
                    <summary>{term.title}</summary>
                    <div className="customer-legal-scroll">
                      <p className="customer-legal-summary">{term.summary}</p>
                      {term.sections.map((section) => (
                        <section key={section.title}>
                          <h3>{section.title}</h3>
                          {section.paragraphs?.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                          ))}
                          {section.bullets && (
                            <ul>
                              {section.bullets.map((bullet) => (
                                <li key={bullet}>{bullet}</li>
                              ))}
                            </ul>
                          )}
                        </section>
                      ))}
                      <div className="customer-legal-references">
                        <b>Referências oficiais</b>
                        {term.references.map((reference) => (
                          <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer">
                            {reference.label} <ExternalLink size={12} />
                          </a>
                        ))}
                      </div>
                    </div>
                  </details>
                ))}

                <div className="customer-legal-checks">
                  <label>
                    <input
                      type="checkbox"
                      checked={acceptedCustomerTerms}
                      onChange={(event) => {
                        setAcceptedCustomerTerms(event.target.checked);
                        clearFormError();
                      }}
                    />
                    <span>
                      Li e aceito os <b>Termos de Uso do Cliente Feiraê</b>.
                    </span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={acknowledgedCustomerPrivacy}
                      onChange={(event) => {
                        setAcknowledgedCustomerPrivacy(event.target.checked);
                        clearFormError();
                      }}
                    />
                    <span>
                      Li o <b>Aviso de Privacidade</b> e estou ciente de como meus dados são tratados.
                    </span>
                  </label>
                  <label className="optional">
                    <input
                      type="checkbox"
                      checked={customerOffersOptIn}
                      onChange={(event) => setCustomerOffersOptIn(event.target.checked)}
                    />
                    <span>
                      Quero receber ofertas e novidades do Feiraê. <em>Opcional.</em>
                    </span>
                  </label>
                </div>
                <p className="customer-legal-note">
                  Ofertas são opcionais. Comunicações necessárias sobre conta, segurança e pedidos podem
                  continuar sendo enviadas para executar o serviço.
                </p>
              </section>
            )}

            {mode === "signup" && selectedRole === "feirante" && (
              <div className="signup-requirements">
                <b>Cadastro de feirante</b>
                <span>Banca, feira, box, documentos, horários e validação antes de vender.</span>
              </div>
            )}
            {mode === "signup" && selectedRole === "delivery" && (
              <div className="signup-requirements">
                <b>Cadastro de entregador</b>
                <span>Veículo, capacidade, CNH/documentos, foto e validação antes de aceitar corridas.</span>
              </div>
            )}
            {formError && (
              <p className="inline-error" role="alert">
                {formError}
              </p>
            )}
            <button type="submit" className="primary-action w-full">
              {mode === "login" ? "Entrar" : "Criar conta"} como {roleLabels[selectedRole]}{" "}
              <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

type HeaderProps = {
  role: Role;
  tab: CustomerTab;
  query: string;
  selectedFair: string;
  locationLabel: string;
  locationLoading: boolean;
  notifications: number;
  itemCount: number;
  showCustomerTools: boolean;
  onHome: () => void;
  onTab: (tab: CustomerTab) => void;
  onQuery: (value: string) => void;
  onFairChange: (value: string) => void;
  onOpenFair: () => void;
  onLocation: () => void;
  onNotifications: () => void;
  onCart: () => void;
  onLogout: () => void;
};
export function Header(props: HeaderProps) {
  const [contextOpen, setContextOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center gap-3 py-2">
          <button onClick={props.onHome} className="brand" aria-label="Ir para o início do Feiraê">
            <span className="brand-mark" aria-hidden="true">
              ê
            </span>
            <span>
              <b>
                Feiraê<i>.</i>
              </b>
              <small>A feira do seu jeito</small>
            </span>
          </button>
          {props.role === "customer" && (
            <nav className="ml-3 hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
              {(["home", "fairs", "products", "orders", "profile"] as CustomerTab[]).map((item) => (
                <button
                  key={item}
                  onClick={() => props.onTab(item)}
                  className={props.tab === item ? "desktop-nav active" : "desktop-nav"}
                >
                  {item === "home"
                    ? "Início"
                    : item === "fairs"
                      ? "Feiras"
                      : item === "products"
                        ? "Produtos"
                        : item === "orders"
                          ? "Pedidos"
                          : "Perfil"}
                </button>
              ))}
            </nav>
          )}
          {props.role === "customer" ? (
            <div className="ml-auto flex items-center gap-2">
              <button onClick={props.onNotifications} className="icon-button" aria-label="Abrir notificações">
                <Bell size={19} />
                {props.notifications > 0 && <span className="badge">{props.notifications}</span>}
              </button>
              <button
                onClick={props.onCart}
                className="cart-button"
                aria-label={`Abrir sacola com ${props.itemCount} ${props.itemCount === 1 ? "unidade" : "unidades"}`}
              >
                <ShoppingBag size={19} />
                <span className="hidden sm:inline">Minha feira</span>
                {props.itemCount > 0 && <span className="cart-count">{props.itemCount}</span>}
              </button>
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              <span className="role-badge">{roleLabels[props.role]}</span>
              <button onClick={props.onLogout} className="logout-button">
                <LogOut size={17} /> Sair
              </button>
            </div>
          )}
        </div>
        {props.role === "customer" && props.showCustomerTools && (
          <div className="customer-tools">
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <span className="sr-only">Buscar produtos, feirantes ou feiras</span>
              <input
                value={props.query}
                onChange={(event) => props.onQuery(event.target.value)}
                placeholder="Busque produtos, feirantes ou feiras"
              />
              {props.query && (
                <button onClick={() => props.onQuery("")} aria-label="Limpar busca">
                  <X size={16} />
                </button>
              )}
            </label>
            <button
              type="button"
              className="context-toggle"
              onClick={() => setContextOpen((value) => !value)}
              aria-expanded={contextOpen}
            >
              <MapPin size={16} />
              <span>
                <b>{props.selectedFair}</b>
                <small>{props.locationLoading ? "Localizando…" : props.locationLabel}</small>
              </span>
              <ChevronRight size={17} />
            </button>
            <div className={contextOpen ? "header-context open" : "header-context"}>
              <div className="fair-switcher">
                <label htmlFor="current-fair">Feira</label>
                <select
                  id="current-fair"
                  value={props.selectedFair}
                  onChange={(event) => props.onFairChange(event.target.value)}
                >
                  {fairs.map((fair) => (
                    <option key={fair.name}>{fair.name}</option>
                  ))}
                </select>
                <button onClick={props.onOpenFair}>Abrir</button>
              </div>
              <button onClick={props.onLocation} className="location-button" disabled={props.locationLoading}>
                <LocateFixed size={17} />
                <span>{props.locationLoading ? "Localizando…" : props.locationLabel}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function RoleDashboard({
  role,
  newAccount = false,
  onOpen,
}: {
  role: Role;
  newAccount?: boolean;
  onOpen: () => void;
}) {
  const config =
    role === "feirante"
      ? {
          icon: <Store />,
          title: "Painel do feirante",
          subtitle: "Pedidos, produtos e operação da sua banca",
          metrics: [
            ["24", "pedidos"],
            ["R$ 1.842", "vendas"],
            ["3", "estoque baixo"],
            ["4,9", "avaliação"],
          ],
        }
      : {
          icon: <Bike />,
          title: "Central do entregador",
          subtitle: "Entregas, rotas e ganhos",
          metrics: [
            ["8", "disponíveis"],
            ["2", "em rota"],
            ["R$ 186", "ganhos hoje"],
            ["4,9", "avaliação"],
          ],
        };
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="role-heading">
        <span>{config.icon}</span>
        <div>
          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>
      </div>
      {newAccount && (
        <div className="region-strip mt-5">
          <Check size={18} />
          <div>
            <b>
              {role === "feirante"
                ? "Configure sua banca para começar"
                : "Complete seu cadastro para entregar"}
            </b>
            <p>
              {role === "feirante"
                ? "Preencha dados da banca, envie documentos, defina horários e cadastre seus primeiros produtos."
                : "Envie documentos, cadastre veículo/capacidade, escolha sua área e aguarde a aprovação antes de ficar disponível."}
            </p>
          </div>
        </div>
      )}
      <div className="metrics">
        {(newAccount
          ? role === "feirante"
            ? [
                ["0", "pedidos"],
                ["R$ 0", "vendas"],
                ["0", "produtos"],
                ["—", "avaliação"],
              ]
            : [
                ["0", "disponíveis"],
                ["0", "em rota"],
                ["R$ 0", "ganhos hoje"],
                ["—", "avaliação"],
              ]
          : config.metrics
        ).map(([value, label]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>
      <button onClick={onOpen} className="primary-action mt-6">
        {newAccount ? "Começar configuração" : "Abrir central operacional"} <ChevronRight size={18} />
      </button>
    </main>
  );
}

export function ModuleHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="module-header">
      <div>
        {badge && <span className="eyebrow">{badge}</span>}
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function FeiraeNotificationCard({
  permission,
  message,
  onEnable,
}: {
  permission: "default" | "denied" | "granted" | "unsupported";
  message: string;
  onEnable: () => void;
}) {
  const statusText =
    permission === "granted"
      ? "Notificações do Feiraê estão ativas neste dispositivo."
      : permission === "denied"
        ? "As notificações estão bloqueadas nas permissões do navegador."
        : permission === "unsupported"
          ? "Este navegador não oferece notificações do sistema."
          : "Ative para receber alertas do Feiraê quando houver uma nova movimentação.";

  return (
    <section className="feirae-notification-card" aria-label="Notificações do Feiraê">
      <img src="/feirae-mark.svg" alt="" aria-hidden="true" />
      <div>
        <span>Feiraê</span>
        <b>{message}</b>
        <small>{statusText}</small>
      </div>
      {permission === "default" && (
        <button type="button" onClick={onEnable}>
          <Bell size={16} /> Ativar notificações
        </button>
      )}
    </section>
  );
}

export function OperationalOnboardingCard({
  title,
  status,
  text,
  steps,
  action,
  onAction,
}: {
  title: string;
  status: string;
  text: string;
  steps: string[];
  action: string;
  onAction: () => void;
}) {
  return (
    <section className="operational-onboarding-card" aria-label={title}>
      <div>
        <span className="eyebrow">Complete seu cadastro</span>
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="onboarding-steps" aria-label="Etapas para liberar a operação">
          {steps.map((step, index) => (
            <span key={step}>
              <i>{index + 1}</i>
              {step}
            </span>
          ))}
        </div>
      </div>
      <div className="onboarding-action">
        <small>Status atual</small>
        <strong>{status}</strong>
        <button type="button" onClick={onAction}>
          {action} <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}

export function PartnerDocumentsHero({
  roleLabel,
  status,
  progress,
  termsSigned,
  termsTotal,
  documentsSent,
  documentsApproved,
  documentsTotal,
  pendingCount,
  onShowPending,
}: {
  roleLabel: string;
  status: string;
  progress: number;
  termsSigned: number;
  termsTotal: number;
  documentsSent: number;
  documentsApproved: number;
  documentsTotal: number;
  pendingCount: number;
  onShowPending: () => void;
}) {
  const statusTone =
    status === "Aprovado"
      ? "approved"
      : status === "Correção necessária"
        ? "error"
        : status === "Em análise"
          ? "review"
          : "pending";

  return (
    <section className="documents-brand-hero" aria-label="Documentos e Regularização">
      <img className="documents-brand-watermark" src="/feirae-mark.svg" alt="" aria-hidden="true" />
      <div className="documents-brand-copy">
        <div className="documents-brand-mark">
          <img src="/feirae-mark.svg" alt="Feiraê" />
          <div>
            <span>Feiraê · {roleLabel}</span>
            <h2>Documentos e Regularização</h2>
          </div>
        </div>
        <h3>Regularize sua conta e opere com segurança no Feiraê.</h3>
        <p>
          Termos, documentos e aprovação em um só lugar, com transparência sobre o que falta e o que já foi
          validado.
        </p>
      </div>

      <div className="documents-status-panel">
        <div className="documents-status-row">
          <div>
            <small>Status do cadastro</small>
            <strong className={`documents-status-value is-${statusTone}`}>{status}</strong>
          </div>
          <span>{progress}%</span>
        </div>
        <div
          className="documents-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Progresso da regularização"
        >
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="documents-summary-grid">
          <div>
            <span>
              {termsSigned}/{termsTotal}
            </span>
            <small>Termos assinados</small>
          </div>
          <div>
            <span>
              {documentsSent}/{documentsTotal}
            </span>
            <small>Documentos enviados</small>
          </div>
          <div>
            <span>
              {documentsApproved}/{documentsTotal}
            </span>
            <small>Documentos aprovados</small>
          </div>
          <div>
            <span>{pendingCount}</span>
            <small>Pendências</small>
          </div>
        </div>
        {pendingCount > 0 ? (
          <button type="button" className="documents-pending-action" onClick={onShowPending}>
            Ver pendências <ChevronRight size={16} />
          </button>
        ) : (
          <div className="documents-complete-message">
            <ShieldCheck size={17} />
            <span>Cadastro documental em dia.</span>
          </div>
        )}
      </div>
    </section>
  );
}

export function DocumentStatusTimeline({
  status,
  fileName,
  correctionReason,
}: {
  status: "pending" | "under_review" | "approved" | "correction_required";
  fileName?: string;
  correctionReason?: string;
}) {
  const steps =
    status === "pending"
      ? ["Pendente de envio"]
      : status === "under_review"
        ? ["Enviado", "Em análise"]
        : status === "approved"
          ? ["Enviado", "Analisado", "Aprovado"]
          : ["Enviado", "Analisado", "Correção solicitada"];

  return (
    <div className={`document-timeline status-${status}`} aria-label="Histórico de análise">
      {steps.map((step, index) => (
        <span key={step} className={index === steps.length - 1 ? "current" : ""}>
          <i>{index + 1}</i>
          {step}
        </span>
      ))}
      {fileName && <small>Arquivo atual: {fileName}</small>}
      {correctionReason && <small className="timeline-correction">Motivo: {correctionReason}</small>}
    </div>
  );
}

export function DocumentsGuidanceCard({ roleLabel }: { roleLabel: string }) {
  return (
    <section className="documents-guidance-card">
      <div className="documents-guidance-title">
        <ShieldCheck size={22} />
        <div>
          <span className="eyebrow">Segurança e transparência</span>
          <h3>Importante antes de enviar</h3>
        </div>
      </div>
      <div className="documents-guidance-grid">
        <p>
          <FileCheck2 size={17} />
          <span>
            Envie arquivos legíveis, verdadeiros e atualizados. Informações falsas podem suspender a conta.
          </span>
        </p>
        <p>
          <ShieldCheck size={17} />
          <span>
            Seus dados devem ser tratados conforme a LGPD e usados somente para finalidades informadas.
          </span>
        </p>
        <p>
          <FileSignature size={17} />
          <span>Termos vigentes precisam estar assinados; nova versão pode exigir novo aceite.</span>
        </p>
        <p>
          <Check size={17} />
          <span>
            O envio não aprova automaticamente o cadastro de {roleLabel.toLocaleLowerCase("pt-BR")}.
          </span>
        </p>
      </div>
    </section>
  );
}

export function LegalTermSignatureCard({
  term,
  acceptance,
  signerName,
  signerEmail,
  onSign,
}: {
  term: LegalTerm;
  acceptance?: LegalAcceptance;
  signerName: string;
  signerEmail: string;
  onSign: (term: LegalTerm, signerName: string) => Promise<void> | void;
}) {
  const currentAcceptance = acceptance?.version === term.version ? acceptance : undefined;
  const [typedName, setTypedName] = useState(currentAcceptance?.signerName ?? signerName);
  const [confirmed, setConfirmed] = useState<boolean[]>(term.declarations.map(() => false));
  const [signing, setSigning] = useState(false);
  const allConfirmed = confirmed.length > 0 && confirmed.every(Boolean);

  async function sign() {
    if (!typedName.trim() || !allConfirmed || signing) return;
    setSigning(true);
    try {
      await onSign(term, typedName.trim());
    } finally {
      setSigning(false);
    }
  }

  return (
    <section className="legal-term-card" aria-label={term.title}>
      <div className="legal-term-heading">
        <span className="legal-term-icon" aria-hidden="true">
          <img src="/feirae-mark.svg" alt="" />
        </span>
        <div>
          <span className="eyebrow">Termo obrigatório · versão {term.version}</span>
          <h3>{term.title}</h3>
          <p>{term.summary}</p>
        </div>
        <span
          className={currentAcceptance ? "document-status status-approved" : "document-status status-review"}
        >
          {currentAcceptance ? "Assinado" : acceptance ? "Nova versão pendente" : "Assinatura pendente"}
        </span>
      </div>

      <details className="legal-term-details">
        <summary>Ler termo completo</summary>
        <div className="legal-term-scroll">
          <header className="legal-document-sheet-header">
            <img src="/feirae-mark.svg" alt="" aria-hidden="true" />
            <div>
              <span>Feiraê · Documento jurídico</span>
              <h4>{term.title}</h4>
              <p>Versão {term.version} · leitura e aceite vinculados à sua conta.</p>
            </div>
          </header>

          {term.sections.map((section) => (
            <section key={section.title}>
              <h4>{section.title}</h4>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section>
            <h4>Bases legais e regulatórias consultadas</h4>
            <ul className="legal-reference-list">
              {term.references.map((reference) => (
                <li key={reference.url}>
                  <a href={reference.url} target="_blank" rel="noreferrer">
                    {reference.label} <ExternalLink size={13} />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <footer className="legal-document-sheet-footer">
            <img src="/feirae-mark.svg" alt="" aria-hidden="true" />
            <span>
              Feiraê · {term.title} · versão {term.version}
            </span>
          </footer>
        </div>
      </details>

      {currentAcceptance ? (
        <div className="legal-signature-proof">
          <img src="/feirae-mark.svg" alt="" aria-hidden="true" />
          <div>
            <b>Assinado eletronicamente por {currentAcceptance.signerName}</b>
            <small>
              {currentAcceptance.signerEmail} · {currentAcceptance.signedAt} · versão{" "}
              {currentAcceptance.version}
            </small>
            <small>Impressão digital: {currentAcceptance.fingerprint.slice(0, 20)}…</small>
          </div>
        </div>
      ) : (
        <div className="legal-signature-form">
          {acceptance && (
            <p className="inline-warning">
              O texto foi atualizado. Leia a versão {term.version} e assine novamente para continuar regular.
            </p>
          )}
          <div className="legal-declarations">
            {term.declarations.map((declaration, index) => (
              <label key={declaration}>
                <input
                  type="checkbox"
                  checked={confirmed[index] ?? false}
                  onChange={(event) =>
                    setConfirmed((current) =>
                      current.map((value, itemIndex) => (itemIndex === index ? event.target.checked : value)),
                    )
                  }
                />
                <span>{declaration}</span>
              </label>
            ))}
          </div>
          <label>
            Nome completo para assinatura eletrônica
            <input
              value={typedName}
              onChange={(event) => setTypedName(event.target.value)}
              autoComplete="name"
              placeholder="Digite seu nome completo"
            />
          </label>
          <p className="legal-signature-note">
            A assinatura será vinculada a {signerEmail}. Ao assinar, o Feiraê registra nome, e-mail,
            data/hora, versão e impressão digital do conteúdo. A assinatura eletrônica deste protótipo não
            substitui a infraestrutura de auditoria e identidade que deverá existir no backend de produção.
          </p>
          <button
            type="button"
            className="primary-action"
            disabled={!typedName.trim() || !allConfirmed || signing}
            onClick={() => void sign()}
          >
            <FileSignature size={17} /> {signing ? "Registrando assinatura..." : "Assinar eletronicamente"}
          </button>
        </div>
      )}
    </section>
  );
}

export function OperationsMenu({
  modules,
  details,
  onOpen,
}: {
  modules: string[];
  details: Record<string, { text: string; badge: string }>;
  onOpen: (module: string) => void;
}) {
  const groupFor = (module: string) => {
    if (["Pedidos", "Entregas", "Em andamento", "Disponibilidade"].includes(module)) return "Agora";
    if (
      [
        "Minha banca",
        "Produtos",
        "Estoque",
        "Horários",
        "Entrega/retirada",
        "Veículos",
        "Forma de entrega",
        "Alertas graves",
      ].includes(module)
    )
      return "Operação";
    if (["Promoções", "Financeiro", "Avaliações", "Desempenho", "Vantagens"].includes(module))
      return "Financeiro e desempenho";
    return "Conta e suporte";
  };
  const groups = ["Agora", "Operação", "Financeiro e desempenho", "Conta e suporte"];
  return (
    <div>
      {groups.map((group) => {
        const groupModules = modules.filter((module) => groupFor(module) === group);
        if (!groupModules.length) return null;
        const groupId = `ops-group-${group.toLocaleLowerCase("pt-BR").replaceAll(" ", "-")}`;
        return (
          <section className="ops-group" key={group} aria-labelledby={groupId}>
            <h3 className="ops-group-title" id={groupId}>
              {group}
            </h3>
            <div className="ops-group-grid">
              {groupModules.map((module) => {
                const detail = details[module] ?? { text: "Abrir módulo operacional.", badge: "Entrar" };
                return (
                  <button
                    className="module-card"
                    key={module}
                    onClick={() => onOpen(module)}
                    aria-label={module}
                  >
                    <span>{detail.badge}</span>
                    <b>{module}</b>
                    <small>{detail.text}</small>
                    <strong>
                      Entrar <ChevronRight size={16} />
                    </strong>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function CartDrawer({
  items,
  cart,
  subtotal,
  onAdd,
  onRemove,
  onClose,
  onBuyAgain,
  onCheckout,
}: {
  items: Product[];
  cart: Record<number, number>;
  subtotal: number;
  onAdd: (id: number) => void;
  onRemove: (id: number, all?: boolean) => void;
  onClose: () => void;
  onBuyAgain: () => void;
  onCheckout: () => void;
}) {
  const totalWeight = cartWeight(items, cart);
  const fairName = items[0]?.fair ?? "";
  const hasVariableWeight = items.some((product) => ["kg", "g"].includes(product.unit));
  const minimumByVendor = Object.fromEntries(
    Array.from(new Set(items.map((product) => product.feirante))).map((vendorName) => {
      const item = items.find((product) => product.feirante === vendorName);
      const store = item ? readStoreByIdentity(item.fair, vendorName) : undefined;
      return [
        vendorName,
        normalizeVendorMinimumOrder(store?.minimumOrderAmount ?? DEFAULT_VENDOR_MINIMUM_ORDER_AMOUNT),
      ];
    }),
  );
  const vendorSummaries = vendorOrderSummaries(items, cart, minimumByVendor);
  const minimumMet = vendorSummaries.every((summary) => summary.meetsMinimum);
  const firstBlockedMinimum = vendorSummaries.find((summary) => !summary.meetsMinimum);
  return (
    <div
      className="drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="drawer-header">
          <div>
            <small>SUA COMPRA</small>
            <h2 id="cart-title">Minha Feira</h2>
            {fairName && <small>{fairName}</small>}
          </div>
          <button onClick={onClose} aria-label="Fechar sacola">
            <X />
          </button>
        </div>
        <div className="drawer-body">
          <button className="repeat-order-button" onClick={onBuyAgain}>
            <ShoppingBag size={17} />
            Comprar novamente
            <small>Repetir itens da última feira</small>
          </button>
          {items.length ? (
            items.map((product) => (
              <article className="cart-item" key={product.id}>
                <span>{product.emoji}</span>
                <div>
                  <b>{product.name}</b>
                  <small>{product.feirante}</small>
                  <small>
                    {cart[product.id]} {product.unit}(s) ·{" "}
                    {productWeight(product, cart[product.id]).toLocaleString("pt-BR", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    kg
                  </small>
                  <strong>{money(product.price * cart[product.id])}</strong>
                  <div>
                    <button
                      onClick={() => onRemove(product.id)}
                      aria-label={`Remover uma unidade de ${product.name}`}
                    >
                      <Minus size={15} />
                    </button>
                    <span>{cart[product.id]}</span>
                    <button
                      onClick={() => onAdd(product.id)}
                      disabled={(cart[product.id] ?? 0) >= product.stock}
                      aria-label={
                        (cart[product.id] ?? 0) >= product.stock
                          ? `Limite de estoque atingido para ${product.name}`
                          : `Adicionar uma unidade de ${product.name}`
                      }
                      title={
                        (cart[product.id] ?? 0) >= product.stock ? "Limite de estoque atingido" : undefined
                      }
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  {(cart[product.id] ?? 0) >= product.stock && (
                    <small className="stock-limit">Limite de estoque atingido</small>
                  )}
                </div>
                <button
                  onClick={() => onRemove(product.id, true)}
                  aria-label={`Excluir ${product.name} da sacola`}
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))
          ) : (
            <Empty title="Sua sacola está vazia" text="Adicione produtos para começar sua feira." />
          )}
        </div>
        {items.length > 0 && (
          <div className="drawer-footer">
            <p>
              <span>Peso estimado</span>
              <b>{totalWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</b>
            </p>
            {hasVariableWeight && (
              <small>
                Há item vendido por peso. Peso e valor finais podem variar na separação; o checkout mostra
                valor estimado.
              </small>
            )}
            <div className="surface-card">
              <span className="eyebrow">Pedido mínimo por banca</span>
              {vendorSummaries.map((summary) => (
                <p key={summary.vendorName}>
                  <span>{summary.vendorName}</span>
                  <b>
                    {summary.minimumOrderAmount > 0
                      ? `${money(summary.subtotal)} · ${
                          summary.meetsMinimum
                            ? "mínimo atingido"
                            : `faltam ${money(summary.missingForMinimum)}`
                        }`
                      : "sem pedido mínimo"}
                  </b>
                </p>
              ))}
              <small>Cada banca define o próprio valor mínimo. Frete e taxas não entram nessa conta.</small>
            </div>
            <p>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </p>
            <button onClick={onCheckout} disabled={!minimumMet} className="primary-action w-full">
              Continuar para checkout
            </button>
            {!minimumMet && firstBlockedMinimum && (
              <small>
                {firstBlockedMinimum.vendorName}: faltam {money(firstBlockedMinimum.missingForMinimum)} para
                atingir o mínimo de {money(firstBlockedMinimum.minimumOrderAmount)}.
              </small>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
export function MobileNavigation({
  active,
  onTab,
}: {
  active: CustomerTab;
  onTab: (tab: CustomerTab) => void;
}) {
  const items: Array<[CustomerTab, string, ReactNode]> = [
    ["home", "Início", <Home />],
    ["fairs", "Feiras", <Store />],
    ["products", "Produtos", <ShoppingBag />],
    ["orders", "Pedidos", <Package />],
    ["profile", "Perfil", <User />],
  ];
  return (
    <nav className="mobile-nav" aria-label="Navegação móvel">
      {items.map(([item, label, icon]) => (
        <button
          key={item}
          type="button"
          onClick={() => onTab(item)}
          className={active === item ? "active" : ""}
          aria-current={active === item ? "page" : undefined}
        >
          <span className="mobile-nav-icon" aria-hidden="true">
            {icon}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
export function Panel({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {onBack && (
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={17} /> Voltar
        </button>
      )}
      <PageHeading title={title} subtitle={subtitle} />
      <div className="mt-6">{children}</div>
    </main>
  );
}
export function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="page-heading">
      <span className="eyebrow">Feiraê</span>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action && (
        <button onClick={onAction}>
          {action} <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
export function QuickAction({
  icon,
  title,
  text,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="quick-action">
      <span aria-hidden="true">{icon}</span>
      <b>{title}</b>
      <small>{text}</small>
      <ChevronRight />
    </button>
  );
}
export function Empty({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <ShoppingBag size={34} />
      <b>{title}</b>
      <p>{text}</p>
      {action && onAction && (
        <button onClick={onAction} className="secondary-action">
          {action} <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface-card">
      <h2>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
export function Choice({
  active,
  disabled = false,
  onClick,
  icon,
  title,
  text,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={active ? "choice active" : disabled ? "choice disabled" : "choice"}
    >
      <span>{icon}</span>
      <b>{title}</b>
      <small>{text}</small>
    </button>
  );
}
export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>
        <b>{label}</b>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}
