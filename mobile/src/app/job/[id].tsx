import { useState } from "react";
import { Linking, Platform, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { Booking } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { addressText, dateTime, rupees } from "@/lib/format";
import { Button, Card, ErrorBox, Loading, SectionTitle, Stars, StatusBadge } from "@/components/ui";
import { callNumber } from "@/components/BusinessCard";

const actions: Record<string, { action: string; title: string }[]> = {
  ASSIGNED: [
    { action: "accept", title: "Accept job" },
    { action: "reject", title: "Decline" },
  ],
  ACCEPTED: [
    { action: "start", title: "Start job" },
    { action: "reject", title: "Can't make it" },
  ],
  IN_PROGRESS: [{ action: "complete", title: "Mark completed & cash collected" }],
};

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: jobs, loading, setData } = useApi<Booking[]>("/provider/jobs");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const job = jobs?.find((j) => j.id === id);

  if (loading) return <Loading />;
  if (!job) return <ErrorBox message="This job is no longer assigned to you." />;

  async function run(action: string) {
    setBusy(action);
    setError(null);
    try {
      const updated = await api<Booking>(`/provider/jobs/${id}/${action}`, { method: "POST" });
      setData(action === "reject" ? jobs!.filter((j) => j.id !== id) : jobs!.map((j) => (j.id === id ? updated : j)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const mapsUrl = `${Platform.OS === "ios" ? "maps:0,0?q=" : "https://www.google.com/maps/search/?api=1&query="}${encodeURIComponent(addressText(job.address))}`;

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }}>
      <Card style={{ gap: 6 }}>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>
          {job.service.category.icon} {job.service.name}
        </Text>
        <StatusBadge status={job.status} />
        <Text style={{ color: colors.muted }}>🗓 {dateTime(job.scheduledAt)}</Text>
        <Text style={{ color: colors.muted }}>💵 Collect {rupees(job.price)} (cash/UPI)</Text>
        {job.notes && <Text style={{ color: colors.muted }}>📝 {job.notes}</Text>}
      </Card>

      <SectionTitle>Customer</SectionTitle>
      <Card style={{ gap: space(2) }}>
        <Text style={{ fontWeight: "800", fontSize: 16 }}>👤 {job.customer.name ?? "Customer"}</Text>
        <Text style={{ color: colors.muted }}>📍 {addressText(job.address)}</Text>
        {["ACCEPTED", "IN_PROGRESS"].includes(job.status) && (
          <View style={{ flexDirection: "row", gap: space(2), marginTop: space(2) }}>
            <Button title="📞 Call" small style={{ flex: 1 }} onPress={() => callNumber(job.customer.phone)} />
            <Button title="🧭 Directions" small variant="secondary" style={{ flex: 1 }} onPress={() => Linking.openURL(mapsUrl)} />
          </View>
        )}
      </Card>

      {job.review && (
        <>
          <SectionTitle>Customer rating</SectionTitle>
          <Card style={{ gap: 4 }}>
            <Stars value={job.review.rating} size={20} />
            {job.review.comment && <Text style={{ color: colors.muted }}>{job.review.comment}</Text>}
          </Card>
        </>
      )}

      <ErrorBox message={error} />
      <View style={{ gap: space(2), marginTop: space(6) }}>
        {(actions[job.status] ?? []).map((a) => (
          <Button
            key={a.action}
            title={a.title}
            variant={a.action === "reject" ? "danger" : "primary"}
            loading={busy === a.action}
            disabled={!!busy}
            onPress={() => run(a.action)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
