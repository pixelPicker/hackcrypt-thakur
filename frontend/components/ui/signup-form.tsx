"use client";

import { useState } from "react";
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

export function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // ✅ SAFE parsing
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") || "").trim();

    // ✅ Basic validation
    if (!email || !password || !name) {
      alert("All fields are required");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      console.error(data?.error || "Registration failed");
      alert(data?.error || "Registration failed");
      return;
    }

    setToast("Registration successful! Redirecting to login...");
    setTimeout(() => {
      setToast(null);
      window.location.href = "/login";
    }, 1500);
  };

  return (
    <div className="relative bg-[url('/bg.jpg')] bg-cover bg-center bg-no-repeat flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-4">

      <div className="absolute inset-0 bg-black/20 backdrop-blur-md"></div>

      <Card className="relative z-10 w-full max-w-md rounded-2xl border border-white/70 bg-white/10 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-2 text-center text-white">
          <CardTitle className="text-xl sm:text-2xl">
            Create an account
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-white/80">
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-2">
              <Label className="text-white">Full Name</Label>
              <Input name="name" required />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Email</Label>
              <Input name="email" type="email" required />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Password</Label>
              <Input name="password" type="password" required />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-white text-black"
            >
              {loading ? "Signing up..." : "Create Account"}
            </Button>
            <p className="text-center text-xs sm:text-sm text-white/80">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="underline underline-offset-4 hover:text-white"
                >
                  Sign in
                </a>
              </p>
          </form>
        </CardContent>
      </Card>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-green-600 px-4 py-2 text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
