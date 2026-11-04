import { FlatList, Text, View } from "react-native";
import { router } from "expo-router";
import { useApi } from "@/lib/useApi";
import type { Business } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { Badge, Button, Card, Empty, Loading, Rating } from "@/components/ui";

const statusStyle = {
  PENDING: { label: "Under review", color: "#92400E", bg: "#FEF3C7" },
  APPROVED: { label: "Live", color: "#166534", bg: "#DCFCE7" },
  REJECTED: { label: "Rejected", color: "#991B1B", bg: "#FEE2E2" },
};

export default function MyBusinesses() {
  const { data, loading } = useApi<Business[]>("/businesses/mine", { refetchOnFocus: true });
  if (loading && !data) return <Loading />;
  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(b) => b.id}
      contentContainerStyle={{ padding: space(4), flexGrow: 1 }}
      ListEmptyComponent={
        <Empty
          icon="🏪"
          title="No listings yet"
          subtitle="List your business for free and reach local customers."
          action={<Button title="List your business" onPress={() => router.push("/add-business")} />}
        />
      }
      renderItem={({ item: b }) => (
        <Card
          style={{ marginBottom: space(3), gap: 6 }}
          onPress={b.status === "APPROVED" ? () => router.push(`/business/${b.id}`) : undefined}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontWeight: "800", fontSize: 16, flex: 1 }}>
              {b.category.icon} {b.name}
            </Text>
            <Badge {...statusStyle[b.status]} />
          </View>
          <Text style={{ color: colors.muted }}>
            {b.address}, {b.city}
          </Text>
          {b.status === "APPROVED" && <Rating value={b.rating} count={b.reviewCount} />}
        </Card>
      )}
    />
  );
}
