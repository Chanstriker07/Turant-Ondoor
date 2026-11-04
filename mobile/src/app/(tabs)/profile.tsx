import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors, radius, space } from "@/lib/theme";
import { Badge, Button, Card } from "@/components/ui";

export default function Profile() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  const items: { icon: string; label: string; href: Href; show?: boolean }[] = [
    { icon: "✏️", label: "Edit profile", href: "/edit-profile" },
    { icon: "📍", label: "Saved addresses", href: "/addresses" },
    { icon: "📅", label: "My bookings", href: "/(tabs)/bookings" },
    { icon: "🏪", label: "My business listings", href: "/my-businesses" },
    { icon: "➕", label: "List your business", href: "/add-business" },
    { icon: "🧰", label: "Become a professional", href: "/provider-register", show: user.role === "CUSTOMER" },
    { icon: "🧰", label: "My jobs", href: "/(tabs)/jobs", show: user.role === "PROVIDER" },
  ];

  const confirmLogout = () => {
    if (Platform.OS === "web") {
      void signOut();
      return;
    }
    Alert.alert("Log out?", "", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void signOut() },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space(4) }}>
      <Card style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(user.name ?? "U").charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.name}>{user.name ?? "Add your name"}</Text>
          <Text style={{ color: colors.muted }}>+91 {user.phone}</Text>
          {user.role !== "CUSTOMER" && <Badge label={user.role === "PROVIDER" ? "Professional" : "Admin"} />}
        </View>
      </Card>

      <Card style={{ padding: 0, marginTop: space(4) }}>
        {items
          .filter((i) => i.show !== false)
          .map((i, idx) => (
            <Pressable
              key={i.label}
              onPress={() => router.push(i.href)}
              style={({ pressed }) => [s.item, idx > 0 && s.itemBorder, pressed && { backgroundColor: colors.bg }]}>
              <Text style={{ fontSize: 18 }}>{i.icon}</Text>
              <Text style={s.itemText}>{i.label}</Text>
              <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
            </Pressable>
          ))}
      </Card>

      <Button title="Log out" variant="danger" onPress={confirmLogout} style={{ marginTop: space(6) }} />
      <Text style={s.version}>Turant Ondoor · v1.0.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: space(4) },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 26, fontWeight: "800" },
  name: { fontSize: 19, fontWeight: "800", color: colors.text },
  item: { flexDirection: "row", alignItems: "center", gap: space(3), padding: space(4), borderRadius: radius.md },
  itemBorder: { borderTopWidth: 1, borderTopColor: colors.border, borderRadius: 0 },
  itemText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: "500" },
  version: { textAlign: "center", color: colors.muted, marginTop: space(4), fontSize: 12 },
});
