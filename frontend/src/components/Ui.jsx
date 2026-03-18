import { NavLink } from "react-router-dom";

export function Page({ title, subtitle, children }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function Card({ title, children, right }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {(title || right) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="text-base font-semibold text-slate-800">{title}</h2> : <span />}
          {right}
        </header>
      )}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Label({ children }) {
  return <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</label>;
}

export function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
    />
  );
}

export function Select(props) {
  return (
    <select
      {...props}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
    />
  );
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
    />
  );
}

export function Button({ variant = "primary", className = "", ...props }) {
  const base = "rounded-md px-3 py-2 text-sm font-semibold transition";
  const styles =
    variant === "secondary"
      ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      : variant === "danger"
        ? "bg-rose-600 text-white hover:bg-rose-700"
        : "bg-sky-600 text-white hover:bg-sky-700";
  return <button {...props} className={`${base} ${styles} ${className}`} />;
}

export function Notice({ kind = "info", children }) {
  const styles =
    kind === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : kind === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-sky-200 bg-sky-50 text-sky-700";
  return <div className={`rounded-md border px-3 py-2 text-sm ${styles}`}>{children}</div>;
}

export function JsonPanel({ data }) {
  if (!data) return <p className="text-sm text-slate-400">No data yet.</p>;
  return (
    <pre className="max-h-96 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function Grid({ children }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

export function SideLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm font-medium transition ${
          isActive ? "bg-sky-600 text-white" : "text-slate-700 hover:bg-slate-100"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
