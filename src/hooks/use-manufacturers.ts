"use client";

import { useState, useEffect } from "react";
import type { Manufacturer } from "@/types";

export function useManufacturers() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/manufacturers")
      .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch"))
      .then(data => setManufacturers(data))
      .catch(err => console.error("Failed to load manufacturers:", err))
      .finally(() => setLoading(false));
  }, []);

  return { manufacturers, loading };
}
