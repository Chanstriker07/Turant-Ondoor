import { Text, View } from "react-native";
import type { Booking } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { dateTime, rupees } from "@/lib/format";
import { Card, StatusBadge } from "./ui";

export default function BookingCard({ booking: b, onPress, showCustomer }: { booking: Booking; onPress: () => void; showCustomer?: boolean }) {
  return (
    <Card style={{ marginBottom: space(3), gap: 6 }} onPress={onPress}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space(2) }}>
        <View style={{ flexDirection: "row", gap: space(2), flex: 1 }}>
          <Text style={{ fontSize: 24 }}>{b.service.category.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{b.service.name}</Text>
            <Text style={{ color: colors.muted }}>{dateTime(b.scheduledAt)}</Text>
          </View>
        </View>
        <Text style={{ fontWeight: "800", color: colors.text }}>{rupees(b.price)}</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <StatusBadge status={b.status} />
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          {showCustomer ? `👤 ${b.customer.name ?? b.customer.phone}` : b.provider ? `👷 ${b.provider.name ?? "Professional"}` : ""}
        </Text>
      </View>
    </Card>
  );
}
