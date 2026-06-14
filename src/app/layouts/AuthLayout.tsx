import { Outlet } from 'react-router-dom'

function AuthLayout() {
  return (
    <div className="mobile-frame-app min-h-screen bg-(--surface-soft) text-[color:var(--text-strong)]">
      <div className="mobile-frame-shell mx-auto min-h-screen px-4 py-6">
        <section className="mt-2">
          <div className="w-full rounded-(--radius-panel) border border-(--border-subtle) bg-[color:var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  )
}

export default AuthLayout
