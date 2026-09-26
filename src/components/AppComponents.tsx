import { FormEvent, ReactNode, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bike,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  LocateFixed,
  LogOut,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
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

  function submit(event: FormEvent) {
    event.preventDefault();
    const error = onLogin(selectedRole, email.trim(), name.trim(), password, mode === "signup");
    setFormError(error ?? "");
  }

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="login-brand">
          <span className="brand-mark">ê</span>
          <b>
            Feiraê<span>.</span>
          </b>
        </div>
        <div>
          <span className="eyebrow light">A feira do seu jeito</span>
          <h1>
            Um aplicativo.
            <br />
            Três experiências.
          </h1>
          <p>Cada pessoa acessa apenas as ferramentas necessárias para sua rotina.</p>
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
              onClick={() => setMode("login")}
            >
              Entrar
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              type="button"
              onClick={() => setMode("signup")}
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
                onClick={() => setSelectedRole(option.role)}
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
                  onChange={(event) => setName(event.target.value)}
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
                onChange={(event) => setEmail(event.target.value)}
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
                  onChange={(event) => setPassword(event.target.value)}
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
              {(["fairs", "products", "orders", "profile"] as CustomerTab[]).map((item) => (
                <button
                  key={item}
                  onClick={() => props.onTab(item)}
                  className={props.tab === item ? "desktop-nav active" : "desktop-nav"}
                >
                  {item === "fairs"
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
                aria-label={`Abrir sacola com ${props.itemCount} itens`}
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
        {props.role === "customer" && (
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
    if (["Painel", "Pedidos", "Entregas", "Em andamento"].includes(module)) return "Agora";
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
        return (
          <section className="ops-group" key={group} aria-labelledby={`ops-group-${group}`}>
            <h3 className="ops-group-title" id={`ops-group-${group}`}>
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
                      aria-label={`Adicionar uma unidade de ${product.name}`}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
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
            <p>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </p>
            <button onClick={onCheckout} className="primary-action w-full">
              Continuar para checkout
            </button>
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
    ["fairs", "Feiras", <Store />],
    ["products", "Produtos", <ShoppingBag />],
    ["orders", "Pedidos", <Package />],
    ["profile", "Perfil", <User />],
  ];
  return (
    <nav className="mobile-nav" aria-label="Navegação móvel">
      {items.map(([item, label, icon]) => (
        <button key={item} onClick={() => onTab(item)} className={active === item ? "active" : ""}>
          {icon}
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
    <button onClick={onClick} className="quick-action">
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
      onClick={onClick}
      disabled={disabled}
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
