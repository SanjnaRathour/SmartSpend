/**
 * Reusable UI primitives for SmartSpend.
 * Built on Tailwind utility classes from styles.css.
 */
import { forwardRef } from 'react';

/* -------------------- Button -------------------- */
const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};
export function Button({ variant = 'primary', className = '', icon: Icon, children, ...rest }) {
  return (
    <button className={`${VARIANTS[variant]} ${className}`} {...rest}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

/* -------------------- Input -------------------- */
export const Input = forwardRef(function Input(
  { label, icon: Icon, className = '', ...rest }, ref
) {
  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1.5">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
        <input ref={ref} className={`input ${Icon ? 'pl-10' : ''} ${className}`} {...rest} />
      </div>
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, className = '', children, ...rest }, ref
) {
  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1.5">{label}</label>}
      <select ref={ref} className={`input ${className}`} {...rest}>{children}</select>
    </div>
  );
});

/* -------------------- Card -------------------- */
export function Card({ className = '', children, ...rest }) {
  return <div className={`card ${className}`} {...rest}>{children}</div>;
}

export function CardHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center">
            <Icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* -------------------- StatCard -------------------- */
import { TrendingUp, TrendingDown } from 'lucide-react';
export function StatCard({
  icon: Icon, label, value, trend,
  currency = true,
  color = 'bg-gradient-to-br from-brand-500 to-brand-700',
}) {
  const formatted = currency
    ? `₹${Number(value).toLocaleString()}`
    : Number(value).toLocaleString();
  return (
    <Card className="!p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{formatted}</p>
          {trend !== undefined && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}% this month
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  );
}

/* -------------------- Badge -------------------- */
const BADGE_TONES = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  brand:   'bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  danger:  'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
};
export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge ${BADGE_TONES[tone]}`}>{children}</span>;
}

/* -------------------- Alert -------------------- */
const ALERT_TONES = {
  error:   'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300',
  info:    'bg-brand-50 dark:bg-brand-950/40 border-brand-100 dark:border-brand-900 text-brand-700 dark:text-brand-300',
  warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
  success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300',
};
export function Alert({ tone = 'info', children }) {
  return <div className={`p-3 rounded-lg border text-sm ${ALERT_TONES[tone]}`}>{children}</div>;
}

/* -------------------- PageHeader -------------------- */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* -------------------- Spinner -------------------- */
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-5 h-5 border-2', md: 'w-10 h-10 border-4', lg: 'w-14 h-14 border-4' };
  return <div className={`animate-spin rounded-full border-brand-200 border-t-brand-600 ${sizes[size]}`} />;
}

export function CenteredSpinner() {
  return <div className="flex items-center justify-center h-96"><Spinner size="md" /></div>;
}

/* -------------------- EmptyState -------------------- */
export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />}
      <p className="text-slate-600 dark:text-slate-300 font-medium">{title}</p>
      {description && <p className="text-xs text-slate-400 mt-2">{description}</p>}
    </div>
  );
}

/* -------------------- AuthShell (shared login/register chrome) -------------------- */
import { Wallet } from 'lucide-react';
export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
