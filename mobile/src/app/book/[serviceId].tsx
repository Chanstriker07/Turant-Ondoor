import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { Address, Booking, Service } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { addressText, rupees } from "@/lib/format";
import { Button, Card, Chip, ErrorBox, Input, Loading, SectionTitle } from "@/components/ui";

const SLOTS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const slotLabel = (h: number) => `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`;

export default function BookScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const service = useApi<Service>(`/services/${serviceId}`);
  const addresses = useApi<Address[]>("/addresses", { refetchOnFocus: true });

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [],
  );
  const [dayIdx, setDayIdx] = useState(0);
  const [hour, setHour] = useState<number | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedAddress = addressId ?? addresses.data?.[0]?.id ?? null;
  const now = new Date();
  const slotAvailable = (h: number) => {
    const d = new Date(days[dayIdx]);
    d.setHours(h);
    return d.getTime() > now.getTime() + 60 * 60 * 1000;
  };

  async function confirm() {
    if (hour === null || !selectedAddress) return;
    const scheduledAt = new Date(days[dayIdx]);
    scheduledAt.setHours(hour);
    setBusy(true);
    setError(null);
    try {
      const booking = await api<Booking>("/bookings", {
        method: "POST",
        body: { serviceId, addressId: selectedAddress, scheduledAt: scheduledAt.toISOString(), notes: notes || undefined },
      });
      router.dismissTo(`/booking/${booking.id}?new=1`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (service.loading || addresses.loading) return <Loading />;
  if (!service.data) return <ErrorBox message={service.error} />;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: space(4) }}>
        <Card>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>{service.data.name}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{rupees(service.data.price)} · pay after service</Text>
        </Card>

        <SectionTitle>Select date</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space(2) }}>
          {days.map((d, i) => (
            <Chip
              key={i}
              label={`${i === 0 ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" })}\n${d.getDate()} ${d.toLocaleDateString("en-IN", { month: "short" })}`}
              selected={dayIdx === i}
              onPress={() => {
                setDayIdx(i);
                setHour(null);
              }}
            />
          ))}
        </ScrollView>

        <SectionTitle>Select time</SectionTitle>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
          {SLOTS.filter(slotAvailable).map((h) => (
            <Chip key={h} label={slotLabel(h)} selected={hour === h} onPress={() => setHour(h)} />
          ))}
          {SLOTS.filter(slotAvailable).length === 0 && <Text style={{ color: colors.muted }}>No slots left today. Pick another date.</Text>}
        </View>

        <SectionTitle action={<Button title="+ Add new" variant="ghost" small onPress={() => router.push("/addresses?add=1")} />}>
          Address
        </SectionTitle>
        {addresses.data?.length === 0 && <Text style={{ color: colors.muted }}>Add an address to continue.</Text>}
        {addresses.data?.map((a) => (
          <Card
            key={a.id}
            onPress={() => setAddressId(a.id)}
            style={{
              marginBottom: space(2),
              borderColor: selectedAddress === a.id ? colors.primary : colors.border,
              backgroundColor: selectedAddress === a.id ? colors.primaryLight : "#fff",
            }}>
            <Text style={{ fontWeight: "700" }}>{a.label}</Text>
            <Text style={{ color: colors.muted }}>{addressText(a)}</Text>
          </Card>
        ))}

        <SectionTitle>Notes for the professional</SectionTitle>
        <Input placeholder="e.g. Gate code, parking info, specific issue…" value={notes} onChangeText={setNotes} multiline />
        <ErrorBox message={error} />
      </ScrollView>
      <View style={{ padding: space(4), backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button
          title={`Confirm booking · ${rupees(service.data.price)}`}
          onPress={confirm}
          loading={busy}
          disabled={hour === null || !selectedAddress}
        />
      </View>
    </SafeAreaView>
  );
}
