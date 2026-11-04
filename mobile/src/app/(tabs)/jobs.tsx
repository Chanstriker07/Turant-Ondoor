import { useState } from "react";
import { FlatList, RefreshControl, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import type { Booking, BookingStatus } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { Card, Chip, Empty, ErrorBox, Loading } from "@/components/ui";
import BookingCard from "@/components/BookingCard";

const filters: { key: string; label: string; statuses: BookingStatus[] }[] = [
  { key: "new", label: "New", statuses: ["ASSIGNED"] },
  { key: "upcoming", label: "Upcoming", statuses: ["ACCEPTED", "IN_PROGRESS"] },
  { key: "done", label: "Completed", statuses: ["COMPLETED", "CANCELLED"] },
];

export default function Jobs() {
  const { user, refreshUser } = useAuth();
  const { data, loading, error, refreshing, refresh } = useApi<Booking[]>("/provider/jobs", { refetchOnFocus: true });
  const [filter, setFilter] = useState("new");
  const profile = user?.provider;

  async function toggleAvailable(v: boolean) {
    await api("/provider/profile", { method: "PATCH", body: { isAvailable: v } });
    await refreshUser();
  }

  if (loading && !data) return <Loading />;
  const statuses = filters.find((f) => f.key === filter)!.statuses;
  const jobs = (data ?? []).filter((j) => statuses.includes(j.status));

  return (
    <FlatList
      data={jobs}
      keyExtractor={(j) => j.id}
      contentContainerStyle={{ padding: space(4), flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListHeaderComponent={
        <View>
          <ErrorBox message={error} />
          {profile && !profile.isVerified && (
            <Card style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A", marginBottom: space(3) }}>
              <Text style={{ fontWeight: "700", color: "#92400E" }}>Verification pending</Text>
              <Text style={{ color: "#92400E" }}>Our team will verify your profile before assigning jobs.</Text>
            </Card>
          )}
          {profile && (
            <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space(3) }}>
              <View>
                <Text style={{ fontWeight: "700", color: colors.text }}>Available for new jobs</Text>
                <Text style={{ color: colors.muted }}>
                  ★ {profile.rating.toFixed(1)} · {profile.ratingCount} ratings
                </Text>
              </View>
              <Switch value={profile.isAvailable} onValueChange={toggleAvailable} trackColor={{ true: colors.primary }} />
            </Card>
          )}
          <View style={{ flexDirection: "row", gap: space(2), marginBottom: space(3) }}>
            {filters.map((f) => (
              <Chip
                key={f.key}
                label={`${f.label} (${(data ?? []).filter((j) => f.statuses.includes(j.status)).length})`}
                selected={filter === f.key}
                onPress={() => setFilter(f.key)}
              />
            ))}
          </View>
        </View>
      }
      ListEmptyComponent={<Empty icon="🧰" title="No jobs here" subtitle="New jobs assigned to you will show up here." />}
      renderItem={({ item }) => <BookingCard booking={item} showCustomer onPress={() => router.push(`/job/${item.id}`)} />}
    />
  );
}
