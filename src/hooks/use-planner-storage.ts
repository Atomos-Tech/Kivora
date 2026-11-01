import { useEffect, useRef, useState } from "react";
import { type AppData, emptyWorkspace, parseWorkspace } from "@/lib/planner";

export const STORE_KEY = "kivora.local.v1";

export function usePlannerStorage() {
  const [data, setData] = useState<AppData>(emptyWorkspace);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [storageBlocked, setStorageBlocked] = useState(false);
  const lastSaved = useRef<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      lastSaved.current = raw;
      if (raw) setData(parseWorkspace(JSON.parse(raw)));
    } catch {
      setStorageBlocked(true);
      setStorageError(
        "Your saved workspace could not be read. It has not been overwritten. Download the original data or restore a valid backup in Settings.",
      );
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || storageBlocked) return;
    try {
      const existing = localStorage.getItem(STORE_KEY);
      if (existing !== lastSaved.current) {
        setStorageBlocked(true);
        setStorageError(
          "This workspace changed in another tab. Download your current work, then reload to use the latest saved version.",
        );
        return;
      }
      const serialized = JSON.stringify(data);
      localStorage.setItem(STORE_KEY, serialized);
      lastSaved.current = serialized;
      setStorageError("");
    } catch {
      setStorageError(
        "Changes could not be saved on this device. Download a backup before leaving this page.",
      );
    }
  }, [data, loaded, storageBlocked]);

  return {
    data,
    setData,
    loaded,
    storageError,
    setStorageError,
    storageBlocked,
    setStorageBlocked,
    lastSaved,
  };
}
