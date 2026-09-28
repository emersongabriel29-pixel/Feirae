type FeiraeBrandProps = {
  compact?: boolean;
  className?: string;
  priority?: boolean;
};

export function FeiraeBrand({ compact = false, className = "", priority = false }: FeiraeBrandProps) {
  return (
    <span
      className={`feirae-brand-lockup ${compact ? "is-compact" : ""} ${className}`.trim()}
      data-testid="feirae-brand-lockup"
    >
      <img
        className="feirae-brand-lockup__image"
        src="/brand/feirae-logo-horizontal.svg"
        alt="Feiraê"
        decoding="async"
        loading={priority ? "eager" : "lazy"}
      />
    </span>
  );
}
