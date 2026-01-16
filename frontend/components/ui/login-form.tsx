"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Logged in successfully!");
      // Redirect user to dashboard or home page
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="relative bg-[url('/bg.jpg')] bg-cover bg-center bg-no-repeat flex min-h-screen items-center justify-center overflow-hidden px-4">

      {/* Background Blur Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md"></div>

      {/* Glass Card */}
      <Card
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl"
      >
        <CardHeader className="space-y-2 text-center text-white">
          <CardTitle className="text-xl sm:text-2xl">
            Login to your account
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-white/80">
            Enter your credentials to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-white">Email</Label>
              <Input
                name="email"
                type="email"
                placeholder="john@cena.com"
                className="h-11 border-white/20 bg-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Password</Label>
              </div>

              <Input
                name="password"
                type="password"
                placeholder="********"
                className="h-11 border-white/20 bg-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20"
                required
              />
            </div>

            {/* Button */}
            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="h-11 w-full cursor-pointer bg-white text-black hover:bg-white/90 font-semibold"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>

              <p className="text-center text-xs sm:text-sm text-white/80">
                Don&apos;t have an account?{" "}
                <a
                  href="/signup"
                  className="underline underline-offset-4 hover:text-white"
                >
                  Sign up
                </a>
              </p>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
