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

export function SignupForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Registration successful! Check your email to confirm.");
    }
  };

  return (
    <div className="relative bg-[url('/bg.jpg')] bg-cover bg-center bg-no-repeat flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-4">
      {/* Background Blur Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md"></div>

      {/* Glass Card */}
      <Card className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-2 text-center text-white">
          <CardTitle className="text-xl sm:text-2xl">Create an account</CardTitle>
          <CardDescription className="text-sm sm:text-base text-white/80">
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full Name */}
            <div className="space-y-2">
              <Label className="text-white">Full Name</Label>
              <Input
                name="name"
                placeholder="John Cena"
                className="h-11 border-white/20 bg-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20"
                required
              />
            </div>

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
              <Label className="text-white">Password</Label>
              <Input
                name="password"
                type="password"
                placeholder="********"
                className="h-11 border-white/20 bg-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="h-11 w-full cursor-pointer bg-white text-black hover:bg-white/90 font-semibold"
                disabled={loading}
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
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
