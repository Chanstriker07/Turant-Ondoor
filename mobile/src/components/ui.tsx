import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors, radius, space } from "@/lib/theme";
import { statusInfo } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
  small,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const v = buttonVariants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: v.bg, borderColor: v.border },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <Text style={[styles.buttonText, small && { fontSize: 13 }, { color: v.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const buttonVariants: Record<ButtonVariant, { bg: string; text: string; border: string }> = {
  primary: { bg: colors.primary, text: "#fff", border: colors.primary },
  secondary: { bg: "#fff", text: colors.primary, border: colors.primary },
  danger: { bg: "#fff", text: colors.danger, border: "#FECACA" },
  ghost: { bg: "transparent", text: colors.primary, border: "transparent" },
};

export function Input({ label, error, style, ...props }: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={{ marginBottom: space(3) }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput placeholderTextColor="#9CA3AF" style={[styles.input, props.multiline && { minHeight: 80, textAlignVertical: "top" }, style]} {...props} />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = statusInfo[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

export function Badge({ label, color = colors.primary, bg = colors.primaryLight }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function Stars({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: onChange ? 8 : 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text
          key={i}
          onPress={onChange ? () => onChange(i) : undefined}
          style={{ fontSize: size, color: i <= Math.round(value) ? colors.star : "#D1D5DB" }}>
          ★
        </Text>
      ))}
    </View>
  );
}

export function Rating({ value, count }: { value: number; count: number }) {
  if (!count) return <Text style={styles.muted}>No ratings yet</Text>;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={styles.ratingPill}>
        <Text style={styles.ratingPillText}>{value.toFixed(1)} ★</Text>
      </View>
      <Text style={styles.muted}>{count} ratings</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function Empty({ icon = "📭", title, subtitle, action }: { icon?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 48 }}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={[styles.muted, { textAlign: "center" }]}>{subtitle}</Text>}
      {action && <View style={{ marginTop: space(4) }}>{action}</View>}
    </View>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={{ color: colors.danger }}>{message}</Text>
    </View>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

export function CategoryTile({ icon, name, onPress }: { icon: string; name: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <View style={styles.tileIcon}>
        <Text style={{ fontSize: 28 }}>{icon}</Text>
      </View>
      <Text style={styles.tileText} numberOfLines={2}>
        {name}
      </Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space(4),
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space(5),
    borderWidth: 1,
  },
  buttonSmall: { minHeight: 34, paddingHorizontal: space(3), borderRadius: radius.sm },
  buttonText: { fontSize: 15, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: space(3),
    paddingVertical: space(3),
    fontSize: 15,
    color: colors.text,
  },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 4 },
  chip: {
    paddingHorizontal: space(3),
    paddingVertical: space(2),
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { color: colors.text, fontWeight: "500" },
  chipTextSelected: { color: colors.primary, fontWeight: "700" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: "flex-start" },
  badgeText: { fontSize: 12, fontWeight: "700" },
  ratingPill: { backgroundColor: colors.success, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  ratingPillText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  muted: { color: colors.muted, fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: space(8), gap: space(2) },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  errorBox: { backgroundColor: "#FEF2F2", padding: space(3), borderRadius: radius.sm, marginBottom: space(3) },
  sectionTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space(5), marginBottom: space(3) },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  tile: { width: "25%", alignItems: "center", paddingVertical: space(2), paddingHorizontal: 2 },
  tileIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  tileText: { fontSize: 12, textAlign: "center", color: colors.text, fontWeight: "500" },
});
