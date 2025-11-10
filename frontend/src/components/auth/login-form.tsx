"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
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
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FcGoogle } from "react-icons/fc";

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

async function loginRequest(
  email: string,
  password: string
): Promise<{ token: string }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts/login/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Login failed (${res.status})`);
  }

  return res.json();
}

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    // resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      const data = await loginRequest(values.email, values.password);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", values.email);
      }
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

  return (
    <div className="w-full max-w-sm md:max-w-md space-y-4 md:space-y-6">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
          Sign in to your Account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome back! Please enter your details.
        </p>
      </div>

      <Button variant="outline" className="w-full text-md md:text-lg py-5 md:py-6">
        <FcGoogle className="mr-3 h-5 w-5 md:mr-4 md:h-6 md:w-6" />
        Sign in with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/change-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full text-md md:text-lg py-5 md:py-6 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 md:h-6 md:w-6 animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
