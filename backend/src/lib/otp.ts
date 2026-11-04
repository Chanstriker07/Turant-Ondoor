import { prisma } from "./prisma";
import { config } from "./config";

// Plug a real SMS gateway (MSG91, Twilio, etc.) in here.
async function sendSms(phone: string, message: string) {
  console.log(`[sms] to ${phone}: ${message}`);
}

export async function issueOtp(phone: string) {
  const code = config.otpDevCode ?? String(Math.floor(100000 + Math.random() * 900000));
  await prisma.otpCode.create({
    data: { phone, code, expiresAt: new Date(Date.now() + config.otpTtlMinutes * 60_000) },
  });
  if (!config.otpDevCode) await sendSms(phone, `Your Turant Ondoor OTP is ${code}`);
  return { devMode: Boolean(config.otpDevCode) };
}

export async function consumeOtp(phone: string, code: string) {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return false;
  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
  return true;
}
