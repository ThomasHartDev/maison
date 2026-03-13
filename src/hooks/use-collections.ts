"use client";

import { useState, useEffect } from "react";
import type { Collection } from "@/types";

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collections")
      .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch"))
      .then(data => setCollections(data))
      .catch(err => console.error("Failed to load collections:", err))
      .finally(() => setLoading(false));
  }, []);

  return { collections, loading };
}
