import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { Button, ErrorBox, Input } from "@/components/ui";

export default function Login() {
  const { user, signIn, refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "name">("phone");
  const [devMode, setDevMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user && step !== "name") return <Redirect href="/" />;

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const requestOtp = () =>
    run(async () => {
      const res = await api<{ devMode: boolean }>("/auth/otp/request", { method: "POST", body: { phone } });
      setDevMode(res.devMode);
      setStep("otp");
    });

  const verifyOtp = () =>
    run(async () => {
      const res = await api<{ token: string; user: User }>("/auth/otp/verify", { method: "POST", body: { phone, code } });
      if (!res.user.name) setStep("name");
      await signIn(res.token, res.user);
    });

  const saveName = () =>
    run(async () => {
      await api("/auth/me", { method: "PATCH", body: { name } });
      await refreshUser();
      setStep("phone");
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.container}>
        <View style={s.hero}>
          <View style={s.logo}>
            <Text style={s.logoText}>T</Text>
          </View>
          <Text style={s.title}>Turant Ondoor</Text>
          <Text style={s.subtitle}>Trusted home services & local businesses, at your doorstep.</Text>
        </View>

        <ErrorBox message={error} />

        {step === "phone" && (
          <>
            <Input
              label="Mobile number"
              placeholder="10-digit mobile number"
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ""))}
              autoFocus
            />
            <Button title="Get OTP" onPress={requestOtp} loading={busy} disabled={phone.length !== 10} />
          </>
        )}

        {step === "otp" && (
          <>
            <Input
              label={`Enter the OTP sent to +91 ${phone}`}
              placeholder="6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, ""))}
              autoFocus
            />
            {devMode && <Text style={s.hint}>Development mode: use OTP 123456</Text>}
            <Button title="Verify & continue" onPress={verifyOtp} loading={busy} disabled={code.length !== 6} />
            <Button title="Change number" variant="ghost" onPress={() => setStep("phone")} style={{ marginTop: space(2) }} />
          </>
        )}

        {step === "name" && (
          <>
            <Input label="What should we call you?" placeholder="Your full name" value={name} onChangeText={setName} autoFocus />
            <Button title="Continue" onPress={saveName} loading={busy} disabled={name.trim().length < 2} />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: space(6), justifyContent: "center", maxWidth: 480, width: "100%", alignSelf: "center" },
  hero: { alignItems: "center", marginBottom: space(8) },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space(4),
  },
  logoText: { color: "#fff", fontSize: 36, fontWeight: "900" },
  title: { fontSize: 28, fontWeight: "900", color: colors.text },
  subtitle: { color: colors.muted, textAlign: "center", marginTop: space(2), fontSize: 15 },
  hint: { color: colors.accent, marginBottom: space(3), fontWeight: "600" },
});
