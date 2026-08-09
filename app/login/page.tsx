import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Freelance Manager
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to manage your work and finances
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  )
}