import { createApp } from "./app";
import { config } from "./lib/config";

createApp().listen(config.port, () => {
  console.log(`Turant Ondoor API listening on http://localhost:${config.port}`);
  if (config.otpDevCode) console.log(`OTP dev mode: use code ${config.otpDevCode}`);
});
