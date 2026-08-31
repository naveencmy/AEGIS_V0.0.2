import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoString) {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getSeverityBadge(severity) {
  const s = (severity || "").toLowerCase();
  switch (s) {
    case "critical":
      return {
        bg: "bg-red-500/10 text-red-400 border-red-500/30",
        pill: "bg-red-500",
        label: "Critical",
      };
    case "high":
      return {
        bg: "bg-orange-500/10 text-orange-400 border-orange-500/30",
        pill: "bg-orange-500",
        label: "High",
      };
    case "medium":
      return {
        bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
        pill: "bg-yellow-500",
        label: "Medium",
      };
    case "low":
    default:
      return {
        bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        pill: "bg-emerald-500",
        label: "Low",
      };
  }
}
