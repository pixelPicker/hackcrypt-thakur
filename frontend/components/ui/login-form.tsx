"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // ✅ SAFE parsing
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();

    const password = String(formData.get("password") || "").trim();

    // ✅ Validate before request
    if (!email || !password) {
      alert("Email and password required");
      setLoading(false);
      return;
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      console.error(res.error);
      alert(res.error || "Invalid email or password");
      return;
    }

    // redirect to homepage on success
    window.location.href = "/";
  };

  return (
    <div className="relative bg-[url('/bg.jpg')] bg-cover bg-center bg-no-repeat flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md"></div>

      <Card className="relative z-10 w-full max-w-md rounded-2xl border border-white/70 bg-white/10 shadow-2xl backdrop-blur-xl">
        <CardHeader className="text-center text-white">
          <CardTitle>Login</CardTitle>
          <CardDescription className="text-white/80">
            Enter your credentials
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <Label className="text-white">Email</Label>
              <Input name="email" type="email" required />
            </div>

            <div>
              <Label className="text-white">Password</Label>
              <Input name="password" type="password" required />
            </div>

            <Button disabled={loading} className="h-11 w-full bg-white text-black">
              {loading ? "Logging in..." : "Login"}
            </Button>

            <p className="text-center text-xs sm:text-sm text-white/80">
              Don&apos;t have an account?{" "}
              <a
                href="/register"
                className="underline underline-offset-4 hover:text-white"
              >
                Create one
              </a>
            </p>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
