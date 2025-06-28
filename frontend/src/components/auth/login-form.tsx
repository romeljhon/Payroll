"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

/* -------------------------------------------------------------------------- */
/*  1. Zod schema & types                                                     */
/* -------------------------------------------------------------------------- */

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

/* -------------------------------------------------------------------------- */
/*  2. API helper (move to /src/ts apis/auth.ts if you wish)                  */
/* -------------------------------------------------------------------------- */
async function loginRequest(
  email: string,
  password: string,
): Promise<{ token: string }> {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
    }/payroll/accounts/login/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Login failed (${res.status})`);
  }

  return res.json(); // { token: "...." }
}

/* -------------------------------------------------------------------------- */
/*  3. Component                                                               */
/* -------------------------------------------------------------------------- */

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  /* ------------------------- submit handler ------------------------------ */
  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);

    try {
      // backend expects `username`; we supply the email
      const data = await loginRequest(values.email, values.password);

      /* -------------------------------------------------------------
         💾  PERSIST TOKEN & EMAIL  (browser-only)
         ------------------------------------------------------------- */
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);   // ⬅️ main requirement
        localStorage.setItem("userEmail", values.email);
      }

      /* ------------------------------------------------------------- */
      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      router.push("/dashboard");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description:
          err.message ??
          "Unable to sign you in. Please check your credentials and try again.",
      });
      form.setError("password", {
        type: "manual",
        message: "Invalid credentials",
      });
    } finally {
      setIsLoading(false);
    }
  }

  /* ----------------------------- UI ------------------------------------- */
  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">Sign In</CardTitle>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <CardContent className="space-y-6">
            {/* ------------------------- Email ------------------------- */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      aria-invalid={!!form.formState.errors.email}
                      aria-describedby="email-error"
                    />
                  </FormControl>
                  <FormMessage id="email-error" />
                </FormItem>
              )}
            />

            {/* ------------------------ Password ----------------------- */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="#"
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        aria-invalid={!!form.formState.errors.password}
                        aria-describedby="password-error"
                        className="pr-10"
                      />
                    </FormControl>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage id="password-error" />
                </FormItem>
              )}
            />
          </CardContent>

          {/* ------------------------- Submit ------------------------ */}
          <CardFooter className="flex flex-col">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
