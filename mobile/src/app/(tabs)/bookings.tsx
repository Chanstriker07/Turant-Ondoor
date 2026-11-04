import { FlatList, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useApi } from "@/lib/useApi";
import type { Booking } from "@/lib/types";
import { space } from "@/lib/theme";
import { Button, Empty, ErrorBox, Loading } from "@/components/ui";
import BookingCard from "@/components/BookingCard";

export default function Bookings() {
  const { data, loading, error, refreshing, refresh } = useApi<Booking[]>("/bookings", { refetchOnFocus: true });
  if (loading && !data) return <Loading />;

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(b) => b.id}
      contentContainerStyle={{ padding: space(4), flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListHeaderComponent={<ErrorBox message={error} />}
      ListEmptyComponent={
        <Empty
          icon="📅"
          title="No bookings yet"
          subtitle="Book a trusted professional for any home service."
          action={<Button title="Explore services" onPress={() => router.push("/")} />}
        />
      }
      renderItem={({ item: b }) => <BookingCard booking={b} onPress={() => router.push(`/booking/${b.id}`)} />}
    />
  );
}
