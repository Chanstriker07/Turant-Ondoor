import { useState } from "react";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { space } from "@/lib/theme";
import { Button, Card, ErrorBox, Input } from "@/components/ui";

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api("/auth/me", { method: "PATCH", body: { name, email } });
      await refreshUser();
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space(4) }}>
      <Card>
        <Input label="Mobile number" value={`+91 ${user?.phone ?? ""}`} editable={false} />
        <Input label="Full name" value={name} onChangeText={setName} />
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <ErrorBox message={error} />
        <Button title="Save" onPress={save} loading={busy} disabled={name.trim().length < 1} />
      </Card>
    </ScrollView>
  );
}
