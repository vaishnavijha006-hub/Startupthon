import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  children: React.ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: Variant;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-laser-cyan/10 border-laser-cyan/50 text-laser-cyan hover:bg-laser-cyan/20 hover:border-laser-cyan hover:shadow-[0_0_24px_rgba(0,229,255,0.25)]',
  secondary:
    'bg-gunmetal/40 border-metallic/30 text-text-primary hover:border-metallic/60 hover:bg-gunmetal/60',
  ghost:
    'bg-transparent border-transparent text-text-secondary hover:text-laser-cyan hover:border-laser-cyan/30',
};

function Button({
  children,
  to,
  href,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  loading = false,
  icon,
}: ButtonProps) {
  const baseClass = `btn-laser btn-pressed focus-cyan inline-flex items-center justify-center gap-2 border px-6 py-3 text-sm clip-angular-sm ${variantClasses[variant]} ${
    disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  } ${className}`;

  const content = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={baseClass}>
        {content}
      </Link>
    );
  }

  if (href && !disabled) {
    return (
      <a href={href} className={baseClass} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={baseClass}>
      {content}
    </button>
  );
}

export default Button;
