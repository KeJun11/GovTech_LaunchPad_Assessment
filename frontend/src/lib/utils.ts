import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  // If it's today, show time only
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // If it's within the last week, show day of week and time
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  if (date > lastWeek) {
    return (
      date.toLocaleDateString([], { weekday: "short" }) +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }

  // Otherwise show full date
  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
