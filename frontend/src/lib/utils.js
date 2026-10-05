import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoString) {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function formatTimeAgo(isoString) {
  if (!isoString) return "";
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

export function getSeverityBadge(severity) {
  const s = (severity || "").toLowerCase();
  switch (s) {
    case "critical":
      return {
        bg: "bg-red-50 text-red-700 border-red-200",
        pill: "bg-red-600",
        label: "Critical",
      };
    case "high":
      return {
        bg: "bg-orange-50 text-orange-700 border-orange-200",
        pill: "bg-orange-500",
        label: "High",
      };
    case "medium":
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        pill: "bg-amber-500",
        label: "Medium",
      };
    case "low":
    default:
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        pill: "bg-emerald-600",
        label: "Low",
      };
  }
}

export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.error("Clipboard write error:", err);
  }
  return false;
}
