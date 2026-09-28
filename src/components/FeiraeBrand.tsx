type FeiraeBrandProps = {
  compact?: boolean;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
};

export function FeiraeBrand({
  compact = false,
  className = "",
  priority = false,
  decorative = false,
}: FeiraeBrandProps) {
  return (
    <span
      className={`feirae-brand-lockup ${compact ? "is-compact" : ""} ${className}`.trim()}
      data-testid="feirae-brand-lockup"
    >
      <img
        className="feirae-brand-lockup__image"
        src={compact ? "/brand/05_versao_horizontal.webp" : "/brand/03_logo_fundo_transparente.webp"}
        alt={decorative ? "" : "Feiraê"}
        aria-hidden={decorative || undefined}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
      />
    </span>
  );
}
