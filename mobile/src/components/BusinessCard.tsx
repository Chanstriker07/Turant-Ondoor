import { Linking, Text, View } from "react-native";
import { router } from "expo-router";
import type { Business } from "@/lib/types";
import { colors, space } from "@/lib/theme";
import { Button, Card, Rating } from "./ui";

export const callNumber = (phone: string) => Linking.openURL(`tel:${phone}`);
export const openWhatsApp = (phone: string, text = "Hi, I found you on Turant Ondoor.") =>
  Linking.openURL(`https://wa.me/${phone.length === 10 ? `91${phone}` : phone}?text=${encodeURIComponent(text)}`);

export default function BusinessCard({ business: b }: { business: Business }) {
  return (
    <Card style={{ marginBottom: space(3) }} onPress={() => router.push(`/business/${b.id}`)}>
      <View style={{ flexDirection: "row", gap: space(3) }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: colors.accentLight,
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Text style={{ fontSize: 28 }}>{b.category.icon}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
            {b.name} {b.isVerified ? "✅" : ""}
          </Text>
          <Rating value={b.rating} count={b.reviewCount} />
          <Text style={{ color: colors.muted }} numberOfLines={1}>
            📍 {b.address}, {b.city}
          </Text>
          {b.openingHours && <Text style={{ color: colors.muted }}>🕒 {b.openingHours}</Text>}
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: space(2), marginTop: space(3) }}>
        <Button title="📞 Call" small style={{ flex: 1 }} onPress={() => callNumber(b.phone)} />
        {b.whatsapp && (
          <Button title="WhatsApp" small variant="secondary" style={{ flex: 1 }} onPress={() => openWhatsApp(b.whatsapp!)} />
        )}
      </View>
    </Card>
  );
}
