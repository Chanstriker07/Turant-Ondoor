import { FlatList, RefreshControl } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useApi } from "@/lib/useApi";
import type { Business } from "@/lib/types";
import { space } from "@/lib/theme";
import { Empty, ErrorBox, Loading } from "@/components/ui";
import BusinessCard from "@/components/BusinessCard";

export default function Listings() {
  const { categoryId, q, title } = useLocalSearchParams<{ categoryId?: string; q?: string; title?: string }>();
  const params = new URLSearchParams({ ...(categoryId ? { categoryId } : {}), ...(q ? { q } : {}) });
  const { data, loading, error, refreshing, refresh } = useApi<Business[]>(`/businesses?${params}`);

  return (
    <>
      <Stack.Screen options={{ title: title ?? (q ? `Results for “${q}”` : "Businesses") }} />
      {loading && !data ? (
        <Loading />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: space(4), flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListHeaderComponent={<ErrorBox message={error} />}
          ListEmptyComponent={<Empty icon="🔎" title="No businesses found" subtitle="Try another category or search term." />}
          renderItem={({ item }) => <BusinessCard business={item} />}
        />
      )}
    </>
  );
}
