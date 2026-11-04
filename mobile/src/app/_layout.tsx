import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

function AuthGate() {
  const { user, ready } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (ready && !user && segments[0] !== "login") router.replace("/login");
  }, [ready, user, segments, router]);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AuthGate />
        <Stack
          screenOptions={{
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="category/[id]" options={{ title: "" }} />
          <Stack.Screen name="service/[id]" options={{ title: "Service details" }} />
          <Stack.Screen name="book/[serviceId]" options={{ title: "Book service" }} />
          <Stack.Screen name="booking/[id]" options={{ title: "Booking details" }} />
          <Stack.Screen name="listings" options={{ title: "" }} />
          <Stack.Screen name="business/[id]" options={{ title: "" }} />
          <Stack.Screen name="add-business" options={{ title: "List your business" }} />
          <Stack.Screen name="my-businesses" options={{ title: "My businesses" }} />
          <Stack.Screen name="addresses" options={{ title: "Saved addresses" }} />
          <Stack.Screen name="edit-profile" options={{ title: "Edit profile" }} />
          <Stack.Screen name="provider-register" options={{ title: "Become a professional" }} />
          <Stack.Screen name="job/[id]" options={{ title: "Job details" }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
