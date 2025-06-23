import LoginForm from "@/components/auth/login-form";
import PayEaseLogo from "@/components/icons/payease-logo";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <PayEaseLogo className="h-12 w-auto text-primary mx-auto" />
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-primary font-headline">
            Welcome to PayEase
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to access your payroll dashboard.
          </p>
        </div>
        <LoginForm />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="#" className="font-medium text-accent hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
