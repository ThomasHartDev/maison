"use client";

import { useState, useEffect, useCallback } from "react";
import type { Dress } from "@/types";

export function useDresses() {
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDresses = useCallback(async () => {
    try {
      const res = await fetch("/api/dresses");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDresses(data);
    } catch (error) {
      console.error("Failed to load dresses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDresses();
  }, [fetchDresses]);

  return { dresses, setDresses, loading, refetch: fetchDresses };
}
