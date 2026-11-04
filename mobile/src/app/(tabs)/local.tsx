import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useApi } from "@/lib/useApi";
import type { Business, Category } from "@/lib/types";
import { colors, radius, space } from "@/lib/theme";
import { Button, CategoryTile, ErrorBox, Loading, SectionTitle } from "@/components/ui";
import BusinessCard from "@/components/BusinessCard";

export default function Local() {
  const [q, setQ] = useState("");
  const cats = useApi<Category[]>("/listing-categories");
  const featured = useApi<Business[]>("/businesses?featured=true");

  const submitSearch = () => {
    if (q.trim()) router.push({ pathname: "/listings", params: { q: q.trim() } });
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: space(4), paddingBottom: space(10) }}
      refreshControl={
        <RefreshControl
          refreshing={cats.refreshing}
          onRefresh={() => {
            void cats.refresh();
            void featured.refresh();
          }}
        />
      }>
      <View style={s.searchRow}>
        <TextInput
          style={s.search}
          placeholder="Search restaurants, doctors, gyms…"
          placeholderTextColor="#9CA3AF"
          value={q}
          onChangeText={setQ}
          onSubmitEditing={submitSearch}
          returnKeyType="search"
        />
        <Button title="Search" onPress={submitSearch} small style={{ minHeight: 46 }} />
      </View>

      <ErrorBox message={cats.error} />
      {cats.loading && <Loading />}
      <View style={s.grid}>
        {cats.data?.map((c) => (
          <CategoryTile
            key={c.id}
            icon={c.icon}
            name={c.name}
            onPress={() => router.push({ pathname: "/listings", params: { categoryId: c.id, title: c.name } })}
          />
        ))}
      </View>

      {!!featured.data?.length && (
        <>
          <SectionTitle>Featured near you</SectionTitle>
          {featured.data.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </>
      )}

      <View style={s.cta}>
        <Text style={s.ctaTitle}>Own a business?</Text>
        <Text style={{ color: colors.muted, marginBottom: space(3) }}>
          List it for free and reach customers in your city.
        </Text>
        <Button title="List your business" variant="secondary" onPress={() => router.push("/add-business")} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  searchRow: { flexDirection: "row", gap: space(2), marginBottom: space(3) },
  search: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space(4),
    fontSize: 15,
    minHeight: 46,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cta: {
    marginTop: space(6),
    padding: space(5),
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
  },
  ctaTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: 4 },
});
