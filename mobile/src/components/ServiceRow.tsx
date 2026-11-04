import { Text, View } from "react-native";
import { router } from "expo-router";
import type { Service } from "@/lib/types";
import { colors, radius, space } from "@/lib/theme";
import { duration, rupees } from "@/lib/format";
import { Card } from "./ui";

const muted = { color: colors.muted };
const price = { fontWeight: "800" as const, color: colors.text, fontSize: 15 };
const addBtn = { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: colors.primaryLight };

export default function ServiceRow({ service }: { service: Service }) {
  return (
    <Card style={{ marginBottom: space(3) }} onPress={() => router.push(`/service/${service.id}`)}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space(3) }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{service.name}</Text>
          <Text style={[muted, { marginTop: 4 }]} numberOfLines={2}>
            {service.description}
          </Text>
          <Text style={[muted, { marginTop: 6 }]}>⏱ {duration(service.durationMins)}</Text>
        </View>
        <View style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
          <Text style={price}>{rupees(service.price)}</Text>
          <View style={addBtn}>
            <Text style={{ color: colors.primary, fontWeight: "800" }}>Book</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

