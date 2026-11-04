import type { ZodTypeAny, z } from "zod";
import { badRequest } from "./errors";

export function parse<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw badRequest(`${issue.path.join(".") || "body"}: ${issue.message}`);
  }
  return result.data;
}

export const param = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : (value ?? "");
