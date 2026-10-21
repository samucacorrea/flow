"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      router.push("/boards");
    } else {
      router.push("/login");
    }
  }, [token, router]);

  return null;
}
