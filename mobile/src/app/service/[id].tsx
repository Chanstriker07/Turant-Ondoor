import { ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApi } from "@/lib/useApi";
import type { Review, Service } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { duration, rupees } from "@/lib/format";
import { Button, Card, ErrorBox, Loading, SectionTitle, Stars } from "@/components/ui";

type Detail = Service & { reviews: (Review & { booking: { customer: { name: string | null } } })[] };

const promises = ["Verified & background-checked professionals", "Pay after service (cash/UPI)", "Free re-visit if not satisfied"];

export default function ServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useApi<Detail>(`/services/${id}`);
  if (loading) return <Loading />;
  if (!data) return <ErrorBox message={error} />;
  const avg = data.reviews.length ? data.reviews.reduce((a, r) => a + r.rating, 0) / data.reviews.length : 0;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: space(4) }}>
        <Card style={{ gap: space(2) }}>
          <Text style={{ fontSize: 36 }}>{data.category?.icon}</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>{data.name}</Text>
          {data.reviews.length > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Stars value={avg} />
              <Text style={{ color: colors.muted }}>
                {avg.toFixed(1)} ({data.reviews.length} reviews)
              </Text>
            </View>
          )}
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>{data.description}</Text>
          <View style={{ flexDirection: "row", gap: space(4), marginTop: space(2) }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>{rupees(data.price)}</Text>
            <Text style={{ color: colors.muted, alignSelf: "center" }}>⏱ {duration(data.durationMins)}</Text>
          </View>
        </Card>

        <SectionTitle>Why Turant Ondoor</SectionTitle>
        <Card style={{ gap: space(2) }}>
          {promises.map((p) => (
            <Text key={p} style={{ color: colors.text }}>
              ✅ {p}
            </Text>
          ))}
        </Card>

        {data.reviews.length > 0 && (
          <>
            <SectionTitle>Customer reviews</SectionTitle>
            {data.reviews.map((r) => (
              <Card key={r.id} style={{ marginBottom: space(2), gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "700" }}>{r.booking.customer.name ?? "Customer"}</Text>
                  <Stars value={r.rating} />
                </View>
                {r.comment && <Text style={{ color: colors.muted }}>{r.comment}</Text>}
              </Card>
            ))}
          </>
        )}
      </ScrollView>
      <View style={{ padding: space(4), backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button title={`Book now · ${rupees(data.price)}`} onPress={() => router.push(`/book/${data.id}`)} />
      </View>
    </SafeAreaView>
  );
}
