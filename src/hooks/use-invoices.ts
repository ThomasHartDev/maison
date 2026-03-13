"use client";

import { useState, useEffect } from "react";
import type { Invoice } from "@/types";

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices")
      .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch"))
      .then(data => setInvoices(data))
      .catch(err => console.error("Failed to load invoices:", err))
      .finally(() => setLoading(false));
  }, []);

  return { invoices, loading };
}
