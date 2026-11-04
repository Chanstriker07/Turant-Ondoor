import { useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { Booking, BookingStatus } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { addressText, dateTime, rupees } from "@/lib/format";
import { Button, Card, ErrorBox, Input, Loading, SectionTitle, Stars, StatusBadge } from "@/components/ui";
import { callNumber } from "@/components/BusinessCard";

const steps: { status: BookingStatus; label: string }[] = [
  { status: "PENDING", label: "Booking placed" },
  { status: "ASSIGNED", label: "Professional assigned" },
  { status: "ACCEPTED", label: "Confirmed by professional" },
  { status: "IN_PROGRESS", label: "Service started" },
  { status: "COMPLETED", label: "Completed" },
];

const confirmAction = (title: string, onYes: () => void) => {
  if (Platform.OS === "web") {
    if (globalThis.confirm?.(title)) onYes();
    return;
  }
  Alert.alert(title, "", [{ text: "No", style: "cancel" }, { text: "Yes", style: "destructive", onPress: onYes }]);
};

export default function BookingDetail() {
  const { id, new: isNew } = useLocalSearchParams<{ id: string; new?: string }>();
  const { data: b, loading, error, setData } = useApi<Booking>(`/bookings/${id}`, { refetchOnFocus: true });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading && !b) return <Loading />;
  if (!b) return <ErrorBox message={error} />;

  const currentStep = steps.findIndex((s) => s.status === b.status);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const cancel = () =>
    confirmAction("Cancel this booking?", () =>
      run(async () => setData(await api<Booking>(`/bookings/${b.id}/cancel`, { method: "POST", body: {} }))),
    );

  const submitReview = () =>
    run(async () => {
      const review = await api<Booking["review"]>(`/bookings/${b.id}/review`, {
        method: "POST",
        body: { rating, comment: comment || undefined },
      });
      setData({ ...b, review });
    });

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }}>
      {isNew && (
        <Card style={{ backgroundColor: "#F0FDF4", borderColor: "#BBF7D0", marginBottom: space(3) }}>
          <Text style={{ fontWeight: "800", color: colors.success, fontSize: 16 }}>🎉 Booking placed!</Text>
          <Text style={{ color: "#166534" }}>We are assigning a verified professional. You will see updates here.</Text>
        </Card>
      )}
      <Card style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, flex: 1 }}>
            {b.service.category.icon} {b.service.name}
          </Text>
          <Text style={{ fontSize: 17, fontWeight: "800" }}>{rupees(b.price)}</Text>
        </View>
        <StatusBadge status={b.status} />
        <Text style={{ color: colors.muted }}>🗓 {dateTime(b.scheduledAt)}</Text>
        <Text style={{ color: colors.muted }}>📍 {addressText(b.address)}</Text>
        <Text style={{ color: colors.muted }}>
          💵 {b.paymentMethod === "CASH" ? "Pay after service" : b.paymentMethod} · {b.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
        </Text>
        {b.notes && <Text style={{ color: colors.muted }}>📝 {b.notes}</Text>}
        <Text style={{ color: colors.muted, fontSize: 12 }}>Booking ID: {b.id}</Text>
      </Card>

      {b.status !== "CANCELLED" ? (
        <>
          <SectionTitle>Status</SectionTitle>
          <Card>
            {steps.map((s, i) => (
              <View key={s.status} style={{ flexDirection: "row", alignItems: "center", gap: space(3), paddingVertical: 6 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: i <= currentStep ? colors.success : colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  {i <= currentStep && <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>✓</Text>}
                </View>
                <Text style={{ color: i <= currentStep ? colors.text : colors.muted, fontWeight: i === currentStep ? "800" : "500" }}>
                  {s.label}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : (
        <Card style={{ marginTop: space(3), backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}>
          <Text style={{ color: colors.danger }}>{b.cancelReason ?? "This booking was cancelled."}</Text>
        </Card>
      )}

      {b.provider && (
        <>
          <SectionTitle>Your professional</SectionTitle>
          <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontWeight: "800", fontSize: 16 }}>👷 {b.provider.name ?? "Professional"}</Text>
              {b.provider.provider && (
                <Text style={{ color: colors.muted }}>
                  ★ {b.provider.provider.rating.toFixed(1)} · {b.provider.provider.experienceYears} yrs experience
                </Text>
              )}
            </View>
            {["ACCEPTED", "IN_PROGRESS"].includes(b.status) && (
              <Button title="📞 Call" small onPress={() => callNumber(b.provider!.phone)} />
            )}
          </Card>
        </>
      )}

      <ErrorBox message={actionError} />

      {b.status === "COMPLETED" && (
        <>
          <SectionTitle>{b.review ? "Your rating" : "Rate your experience"}</SectionTitle>
          <Card style={{ gap: space(3) }}>
            {b.review ? (
              <>
                <Stars value={b.review.rating} size={24} />
                {b.review.comment && <Text style={{ color: colors.muted }}>{b.review.comment}</Text>}
              </>
            ) : (
              <>
                <Stars value={rating} size={32} onChange={setRating} />
                <Input placeholder="Tell us about the service (optional)" value={comment} onChangeText={setComment} multiline />
                <Button title="Submit rating" onPress={submitReview} disabled={!rating} loading={busy} />
              </>
            )}
          </Card>
        </>
      )}

      {["PENDING", "ASSIGNED", "ACCEPTED"].includes(b.status) && (
        <Button title="Cancel booking" variant="danger" onPress={cancel} loading={busy} style={{ marginTop: space(6) }} />
      )}
    </ScrollView>
  );
}
