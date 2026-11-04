import { useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import type { Business } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { Badge, Button, Card, ErrorBox, Input, Loading, Rating, SectionTitle, Stars } from "@/components/ui";
import { callNumber, openWhatsApp } from "@/components/BusinessCard";

export default function BusinessDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: b, loading, error, reload } = useApi<Business>(`/businesses/${id}`);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (loading) return <Loading />;
  if (!b) return <ErrorBox message={error} />;

  async function submitReview() {
    setBusy(true);
    setReviewError(null);
    try {
      await api(`/businesses/${id}/reviews`, { method: "POST", body: { rating, comment: comment || undefined } });
      setSubmitted(true);
      setRating(0);
      setComment("");
      await reload();
    } catch (e) {
      setReviewError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const info: [string, string | null][] = [
    ["📍", `${b.address}, ${b.city}${b.pincode ? ` - ${b.pincode}` : ""}`],
    ["🕒", b.openingHours],
    ["📞", `+91 ${b.phone}`],
    ["✉️", b.email],
    ["🌐", b.website],
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }}>
      <Stack.Screen options={{ title: b.name }} />
      <Card style={{ gap: space(2) }}>
        <View style={{ flexDirection: "row", gap: space(3), alignItems: "center" }}>
          <Text style={{ fontSize: 44 }}>{b.category.icon}</Text>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>{b.name}</Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Badge label={b.category.name} />
              {b.isVerified && <Badge label="✓ Verified" color={colors.success} bg="#DCFCE7" />}
            </View>
          </View>
        </View>
        <Rating value={b.rating} count={b.reviewCount} />
        {!!b.description && <Text style={{ color: colors.muted, lineHeight: 20 }}>{b.description}</Text>}
        <View style={{ flexDirection: "row", gap: space(2), marginTop: space(2) }}>
          <Button title="📞 Call now" style={{ flex: 1 }} onPress={() => callNumber(b.phone)} />
          {b.whatsapp && <Button title="WhatsApp" variant="secondary" style={{ flex: 1 }} onPress={() => openWhatsApp(b.whatsapp!)} />}
        </View>
      </Card>

      <SectionTitle>Details</SectionTitle>
      <Card style={{ gap: space(3) }}>
        {info
          .filter(([, v]) => v)
          .map(([icon, v]) => (
            <Text
              key={icon}
              style={{ color: icon === "🌐" ? colors.primary : colors.text }}
              onPress={icon === "🌐" ? () => Linking.openURL(v!) : undefined}>
              {icon} {v}
            </Text>
          ))}
      </Card>

      <SectionTitle>Reviews ({b.reviewCount})</SectionTitle>
      {user && (
        <Card style={{ gap: space(3), marginBottom: space(3) }}>
          <Text style={{ fontWeight: "700" }}>{submitted ? "Thanks for your review! Update it anytime:" : "Rate this business"}</Text>
          <Stars value={rating} size={30} onChange={setRating} />
          <Input placeholder="Share your experience (optional)" value={comment} onChangeText={setComment} multiline />
          <ErrorBox message={reviewError} />
          <Button title="Submit review" onPress={submitReview} disabled={!rating} loading={busy} />
        </Card>
      )}
      {b.reviews?.map((r) => (
        <Card key={r.id} style={{ marginBottom: space(2), gap: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontWeight: "700" }}>{r.user?.name ?? "User"}</Text>
            <Stars value={r.rating} />
          </View>
          {r.comment && <Text style={{ color: colors.muted }}>{r.comment}</Text>}
        </Card>
      ))}
    </ScrollView>
  );
}
