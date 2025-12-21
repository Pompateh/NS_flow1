import { LoginForm } from "@/app/login/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
              Sign in
            </h1>
            <p className="text-sm text-zinc-600">
              Sign in using your username and password.
            </p>
          </div>

          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
