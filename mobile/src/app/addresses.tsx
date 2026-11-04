import { useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { Address } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { addressText } from "@/lib/format";
import { Button, Card, Chip, Empty, ErrorBox, Input, Loading } from "@/components/ui";

const blank = { label: "Home", line1: "", line2: "", landmark: "", city: "", pincode: "" };

export default function Addresses() {
  const { add } = useLocalSearchParams<{ add?: string }>();
  const { data, loading, reload } = useApi<Address[]>("/addresses");
  const [adding, setAdding] = useState(Boolean(add));
  const [form, setForm] = useState(blank);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bind = (k: keyof typeof blank) => ({ value: form[k], onChangeText: (v: string) => setForm((f) => ({ ...f, [k]: v })) });

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api("/addresses", {
        method: "POST",
        body: { ...form, line2: form.line2 || undefined, landmark: form.landmark || undefined },
      });
      setForm(blank);
      setAdding(false);
      if (add) {
        router.back();
        return;
      }
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: Address) {
    const doDelete = async () => {
      try {
        await api(`/addresses/${a.id}`, { method: "DELETE" });
        await reload();
      } catch (e) {
        setError((e as Error).message);
      }
    };
    if (Platform.OS === "web") return doDelete();
    Alert.alert("Delete address?", "", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: doDelete },
    ]);
  }

  if (loading && !data) return <Loading />;

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(10), flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <ErrorBox message={error} />
      {adding ? (
        <Card>
          <Text style={{ fontWeight: "800", fontSize: 16, marginBottom: space(3) }}>New address</Text>
          <View style={{ flexDirection: "row", gap: space(2), marginBottom: space(3) }}>
            {["Home", "Work", "Other"].map((l) => (
              <Chip key={l} label={l} selected={form.label === l} onPress={() => setForm({ ...form, label: l })} />
            ))}
          </View>
          <Input label="House / flat no., building *" {...bind("line1")} />
          <Input label="Street, area" {...bind("line2")} />
          <Input label="Landmark" {...bind("landmark")} />
          <View style={{ flexDirection: "row", gap: space(3) }}>
            <View style={{ flex: 1 }}>
              <Input label="City *" {...bind("city")} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Pincode *" keyboardType="number-pad" maxLength={6} {...bind("pincode")} />
            </View>
          </View>
          <Button title="Save address" onPress={save} loading={busy} disabled={!form.line1 || !form.city || form.pincode.length !== 6} />
          <Button title="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ marginTop: space(2) }} />
        </Card>
      ) : (
        <>
          {data?.length === 0 && <Empty icon="📍" title="No saved addresses" subtitle="Add an address to book services faster." />}
          {data?.map((a) => (
            <Card key={a.id} style={{ marginBottom: space(3), flexDirection: "row", alignItems: "center", gap: space(3) }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "800" }}>{a.label}</Text>
                <Text style={{ color: colors.muted }}>{addressText(a)}</Text>
              </View>
              <Button title="Delete" variant="danger" small onPress={() => remove(a)} />
            </Card>
          ))}
          <Button title="+ Add new address" onPress={() => setAdding(true)} style={{ marginTop: space(2) }} />
        </>
      )}
    </ScrollView>
  );
}
