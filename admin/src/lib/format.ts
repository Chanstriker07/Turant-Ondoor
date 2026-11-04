export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });

export const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
