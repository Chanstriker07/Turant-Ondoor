import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import type { Category, Service } from "@/lib/types";
import { colors, radius, space } from "@/lib/theme";
import { rupees } from "@/lib/format";
import ServiceRow from "@/components/ServiceRow";
import { Card, CategoryTile, ErrorBox, Loading, SectionTitle } from "@/components/ui";

export default function Home() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const categories = useApi<Category[]>("/categories");
  const popular = useApi<Service[]>("/services");
  const search = useApi<Service[]>(q.trim().length >= 2 ? `/services?q=${encodeURIComponent(q.trim())}` : null);

  const firstName = user?.name?.split(" ")[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: space(8) }}
        refreshControl={
          <RefreshControl
            refreshing={categories.refreshing}
            onRefresh={() => {
              void categories.refresh();
              void popular.refresh();
            }}
          />
        }>
        <View style={s.header}>
          <Text style={s.greeting}>Hi{firstName ? ` ${firstName}` : ""} 👋</Text>
          <Text style={s.headline}>What service do you need today?</Text>
          <TextInput
            style={s.search}
            placeholder="Search for 'AC service', 'plumber'…"
            placeholderTextColor="#9CA3AF"
            value={q}
            onChangeText={setQ}
          />
        </View>

        <View style={{ paddingHorizontal: space(4) }}>
          {q.trim().length >= 2 ? (
            <>
              <SectionTitle>Search results</SectionTitle>
              {search.loading ? <Loading /> : null}
              {search.data?.length === 0 && <Text style={s.muted}>No services match “{q}”.</Text>}
              {search.data?.map((svc) => <ServiceRow key={svc.id} service={svc} />)}
            </>
          ) : (
            <>
              <ErrorBox message={categories.error} />
              {categories.loading && <Loading />}
              <View style={s.grid}>
                {categories.data?.map((c) => (
                  <CategoryTile key={c.id} icon={c.icon} name={c.name} onPress={() => router.push(`/category/${c.id}`)} />
                ))}
              </View>

              <Pressable style={s.banner} onPress={() => router.push("/(tabs)/local")}>
                <View style={{ flex: 1 }}>
                  <Text style={s.bannerTitle}>Find local businesses</Text>
                  <Text style={s.bannerText}>Restaurants, clinics, gyms & more near you</Text>
                </View>
                <Text style={{ fontSize: 40 }}>📍</Text>
              </Pressable>

              <SectionTitle>Popular services</SectionTitle>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={popular.data?.slice(0, 10) ?? []}
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ gap: space(3) }}
                renderItem={({ item }) => (
                  <Card style={s.popular} onPress={() => router.push(`/service/${item.id}`)}>
                    <Text style={{ fontSize: 28 }}>{item.category?.icon}</Text>
                    <Text style={s.popularName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={s.price}>{rupees(item.price)}</Text>
                  </Card>
                )}
              />

              {user?.role === "CUSTOMER" && (
                <Card style={s.proCard} onPress={() => router.push("/provider-register")}>
                  <Text style={{ fontSize: 32 }}>🧰</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.bannerTitle}>Are you a professional?</Text>
                    <Text style={s.muted}>Join Turant Ondoor and get jobs near you.</Text>
                  </View>
                </Card>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    padding: space(5),
    paddingTop: space(4),
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    marginBottom: space(2),
  },
  greeting: { color: "#C7D2FE", fontSize: 15, fontWeight: "600" },
  headline: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 4, marginBottom: space(4) },
  search: { backgroundColor: "#fff", borderRadius: radius.md, paddingHorizontal: space(4), paddingVertical: space(3), fontSize: 15 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: space(3) },
  banner: {
    marginTop: space(4),
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
    padding: space(4),
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  bannerTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  bannerText: { color: "#9A3412", marginTop: 2 },
  popular: { width: 150, gap: 6 },
  popularName: { fontWeight: "700", color: colors.text, minHeight: 36 },
  price: { fontWeight: "800", color: colors.text, fontSize: 15 },
  muted: { color: colors.muted },
  proCard: { marginTop: space(5), flexDirection: "row", alignItems: "center", gap: space(3) },
});
