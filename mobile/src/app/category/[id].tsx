import { ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useApi } from "@/lib/useApi";
import type { Category, Service } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { Empty, ErrorBox, Loading } from "@/components/ui";
import ServiceRow from "@/components/ServiceRow";

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useApi<Category & { services: Service[] }>(`/categories/${id}`);
  if (loading) return <Loading />;
  return (
    <ScrollView contentContainerStyle={{ padding: space(4) }}>
      <Stack.Screen options={{ title: data?.name ?? "" }} />
      <ErrorBox message={error} />
      {data && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space(3), marginBottom: space(4) }}>
          <Text style={{ fontSize: 40 }}>{data.icon}</Text>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>{data.name}</Text>
            <Text style={{ color: colors.muted }}>{data.services.length} services · verified professionals</Text>
          </View>
        </View>
      )}
      {data?.services.length === 0 && <Empty title="No services yet" subtitle="Check back soon." />}
      {data?.services.map((svc) => <ServiceRow key={svc.id} service={svc} />)}
    </ScrollView>
  );
}
