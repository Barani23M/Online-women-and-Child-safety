import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { safePlaceAPI } from "../../services/api";
import { COLORS, RADIUS, SHADOW } from "../../theme";

const TYPE_ICONS = {
  police_station: "🚔",
  hospital: "🏥",
  shelter: "🏠",
  ngo: "🤝",
  government_office: "🏛️",
  other: "📍",
};

export default function SafeRoutesScreen() {
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    safePlaceAPI.list().then(({ data }) => setPlaces(data || [])).catch(() => {});
  }, []);

  const types = ["all", ...new Set(places.map((p) => p.place_type))];
  const filtered = places.filter((p) => {
    const matchType = filter === "all" || p.place_type === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.address?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="🔍  Search by name or city..."
          placeholderTextColor={COLORS.gray400}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Type filter */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={types}
          keyExtractor={(t) => t}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          renderItem={({ item: t }) => (
            <TouchableOpacity
              style={[styles.chip, filter === t && styles.chipActive]}
              onPress={() => setFilter(t)}
            >
              <Text style={[styles.chipText, filter === t && styles.chipTextActive]}>
                {t === "all" ? "All" : t.replace(/_/g, " ")}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No safe places found.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.typeIcon}>{TYPE_ICONS[item.place_type] || "📍"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.typeLabel}>{item.place_type?.replace(/_/g, " ")}</Text>
              </View>
              {item.is_24_hours && (
                <View style={styles.badge24}>
                  <Text style={styles.badge24Text}>24/7</Text>
                </View>
              )}
            </View>
            {item.address && <Text style={styles.address}>📍 {item.address}</Text>}
            {item.phone && <Text style={styles.phone}>📞 {item.phone}</Text>}
            {item.description && <Text style={styles.desc}>{item.description}</Text>}
            {item.latitude && item.longitude && (
              <Text style={styles.coords}>
                🗺️ {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray50 },
  searchRow: { backgroundColor: COLORS.white, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  search: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.text, backgroundColor: COLORS.gray50 },
  filterWrap: { backgroundColor: COLORS.white, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.gray600, fontWeight: "600", textTransform: "capitalize" },
  chipTextActive: { color: COLORS.primary },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  empty: { textAlign: "center", color: COLORS.gray400, marginTop: 40 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 14, ...SHADOW.sm },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  typeIcon: { fontSize: 28 },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.gray800 },
  typeLabel: { fontSize: 12, color: COLORS.primary, textTransform: "capitalize", marginTop: 1 },
  badge24: { backgroundColor: COLORS.successBg, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  badge24Text: { fontSize: 11, fontWeight: "700", color: COLORS.success },
  address: { fontSize: 13, color: COLORS.gray600, marginBottom: 4 },
  phone: { fontSize: 13, color: COLORS.danger, fontWeight: "600", marginBottom: 4 },
  desc: { fontSize: 13, color: COLORS.gray500, lineHeight: 18, marginBottom: 4 },
  coords: { fontSize: 11, color: COLORS.gray400 },
});
