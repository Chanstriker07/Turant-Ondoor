import jwt from "jsonwebtoken";
import { config } from "./config";
import type { Role } from "./constants";

export interface TokenPayload {
  sub: string;
  role: Role;
}

export const signToken = (payload: TokenPayload) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: "30d" });

export const verifyToken = (token: string) => jwt.verify(token, config.jwtSecret) as TokenPayload;
