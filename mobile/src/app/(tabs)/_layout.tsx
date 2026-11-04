import { Text } from "react-native";
import { Tabs } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";
import { Loading } from "@/components/ui";

const icon = (emoji: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
  };

export default function TabLayout() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  const isProvider = user?.role === "PROVIDER";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "800" },
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: "Services", headerShown: false, tabBarIcon: icon("🏠") }} />
      <Tabs.Screen name="local" options={{ title: "Local", headerTitle: "Local businesses", tabBarIcon: icon("📍") }} />
      <Tabs.Screen name="bookings" options={{ title: "Bookings", headerTitle: "My bookings", tabBarIcon: icon("📅") }} />
      <Tabs.Screen
        name="jobs"
        options={{ title: "Jobs", headerTitle: "My jobs", tabBarIcon: icon("🧰"), href: isProvider ? undefined : null }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("👤") }} />
    </Tabs>
  );
}
