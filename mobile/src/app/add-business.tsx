import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { Category } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { Button, Card, Chip, ErrorBox, Input, Loading } from "@/components/ui";

const empty = {
  name: "",
  description: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  address: "",
  city: "",
  pincode: "",
  openingHours: "",
};

export default function AddBusiness() {
  const cats = useApi<Category[]>("/listing-categories");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const bind = (k: keyof typeof empty) => ({ value: form[k], onChangeText: (v: string) => setForm((f) => ({ ...f, [k]: v })) });

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api("/businesses", { method: "POST", body: { ...form, categoryId } });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (cats.loading) return <Loading />;
  if (done) {
    return (
      <View style={{ flex: 1, padding: space(6), justifyContent: "center", alignItems: "center", gap: space(3) }}>
        <Text style={{ fontSize: 56 }}>🎉</Text>
        <Text style={{ fontSize: 20, fontWeight: "800" }}>Submitted for review</Text>
        <Text style={{ color: colors.muted, textAlign: "center" }}>
          Our team will verify your listing shortly. It will appear in search once approved.
        </Text>
        <Button title="View my listings" onPress={() => router.replace("/my-businesses")} style={{ alignSelf: "stretch" }} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={{ fontWeight: "700", marginBottom: space(2) }}>Category</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2), marginBottom: space(4) }}>
          {cats.data?.map((c) => (
            <Chip key={c.id} label={`${c.icon} ${c.name}`} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
          ))}
        </View>
        <Input label="Business name *" {...bind("name")} />
        <Input label="About your business" multiline {...bind("description")} />
        <Input label="Phone number *" keyboardType="phone-pad" maxLength={12} {...bind("phone")} />
        <Input label="WhatsApp number" keyboardType="phone-pad" maxLength={12} {...bind("whatsapp")} />
        <Input label="Full address *" {...bind("address")} />
        <View style={{ flexDirection: "row", gap: space(3) }}>
          <View style={{ flex: 1 }}>
            <Input label="City *" {...bind("city")} />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Pincode" keyboardType="number-pad" maxLength={6} {...bind("pincode")} />
          </View>
        </View>
        <Input label="Opening hours" placeholder="e.g. 9:00 AM - 9:00 PM" {...bind("openingHours")} />
        <Input label="Email" keyboardType="email-address" autoCapitalize="none" {...bind("email")} />
        <Input label="Website" autoCapitalize="none" placeholder="https://" {...bind("website")} />
        <ErrorBox message={error} />
        <Button
          title="Submit listing"
          onPress={submit}
          loading={busy}
          disabled={!categoryId || !form.name || !form.phone || !form.address || !form.city}
        />
      </Card>
    </ScrollView>
  );
}
