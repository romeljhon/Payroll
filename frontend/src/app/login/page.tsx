import LoginForm from '../../components/auth/login-form';
import KazuPaySolutionsLogo from '@/components/icons/payease-logo';
import Link from 'next/link';
import Aurora from '@/components/auth/Aurora';

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Panel */}
      <div className="relative hidden lg:flex flex-col items-center justify-center bg-gray-900 text-white p-12">
        <Aurora />
        <div className="relative z-10 text-center">
          <Link href="/">
            <KazuPaySolutionsLogo className="h-16 w-auto mx-auto text-primary" />
          </Link>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight">
            Welcome to KazuPay Solutions
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-md mx-auto">
            The smart, intuitive, and powerful payroll solution for modern
            businesses.
          </p>
        </div>
        <div className="absolute bottom-8 text-sm text-gray-400">
          &copy; {new Date().getFullYear()} KazuPay Solutions. All rights
          reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col items-center justify-center bg-background p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-block">
              <KazuPaySolutionsLogo className="h-12 w-auto text-primary mx-auto" />
            </Link>
          </div>
          <LoginForm />
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
