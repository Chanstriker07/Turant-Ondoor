import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import type { Category } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { Button, Card, Chip, ErrorBox, Input, Loading } from "@/components/ui";

export default function ProviderRegister() {
  const { setToken, refreshUser } = useAuth();
  const cats = useApi<Category[]>("/categories");
  const [selected, setSelected] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ token: string }>("/provider/register", {
        method: "POST",
        body: { categoryIds: selected, city, experienceYears: Number(experience) || 0, bio },
      });
      await setToken(res.token);
      await refreshUser();
      router.replace("/(tabs)/jobs");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (cats.loading) return <Loading />;

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }} keyboardShouldPersistTaps="handled">
      <Card style={{ backgroundColor: colors.primaryLight, borderColor: "#C7D2FE", marginBottom: space(4) }}>
        <Text style={{ fontWeight: "800", fontSize: 16, color: colors.primary }}>Earn with Turant Ondoor</Text>
        <Text style={{ color: colors.text, marginTop: 4 }}>
          Get regular jobs in your area. Our team verifies every professional before assigning jobs.
        </Text>
      </Card>
      <Card>
        <Text style={{ fontWeight: "700", marginBottom: space(2) }}>Services you offer *</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2), marginBottom: space(4) }}>
          {cats.data?.map((c) => (
            <Chip key={c.id} label={`${c.icon} ${c.name}`} selected={selected.includes(c.id)} onPress={() => toggle(c.id)} />
          ))}
        </View>
        <Input label="City you work in *" value={city} onChangeText={setCity} />
        <Input label="Years of experience" keyboardType="number-pad" maxLength={2} value={experience} onChangeText={setExperience} />
        <Input label="About you" placeholder="Skills, certifications, tools you carry…" multiline value={bio} onChangeText={setBio} />
        <ErrorBox message={error} />
        <Button title="Register as professional" onPress={submit} loading={busy} disabled={!selected.length || city.trim().length < 2} />
      </Card>
    </ScrollView>
  );
}
