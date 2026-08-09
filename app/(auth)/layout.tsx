export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
