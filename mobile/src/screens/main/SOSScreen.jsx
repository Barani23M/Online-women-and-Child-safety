import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { sosAPI } from "../../services/api";
import { COLORS, RADIUS, SHADOW } from "../../theme";

export default function SOSScreen() {
  const [sending, setSending] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [message, setMessage] = useState("I need immediate help! Please send assistance.");
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | fetching | ok | denied

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    try {
      const { data } = await sosAPI.myAlerts();
      setAlerts(data || []);
    } catch {
      setAlerts([]);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const getLocation = useCallback(async () => {
    setLocationStatus("fetching");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationStatus("denied");
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocationStatus("ok");
      return loc.coords;
    } catch {
      setLocationStatus("denied");
      return null;
    }
  }, []);

  const triggerSOS = async () => {
    Alert.alert(
      "🆘 Confirm SOS",
      "This will send an emergency alert with your GPS location. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "SEND SOS",
          style: "destructive",
          onPress: async () => {
            setSending(true);
            try {
              const coords = await getLocation();
              const payload = {
                message: message.trim() || "Emergency! I need help!",
                latitude: coords?.latitude,
                longitude: coords?.longitude,
              };
              await sosAPI.trigger(payload);
              Alert.alert("✅ SOS Sent", "Emergency alert has been sent. Help is on the way. Stay safe!");
              await loadAlerts();
            } catch (err) {
              const msg = err?.response?.data?.detail || "Failed to send SOS. Please call 112 directly.";
              Alert.alert("Error", msg);
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  const activeAlerts = alerts.filter((a) => a.is_active);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>SOS Emergency Alert</Text>
        <Text style={styles.sub}>Press the button below to send an emergency alert with your GPS location.</Text>

        {/* SOS Button */}
        <View style={styles.sosBtnWrapper}>
          <TouchableOpacity
            style={[styles.sosBtn, sending && { opacity: 0.6 }]}
            onPress={triggerSOS}
            disabled={sending}
            activeOpacity={0.7}
          >
            {sending
              ? <ActivityIndicator size="large" color={COLORS.white} />
              : <Text style={styles.sosBtnText}>🆘{"\n"}SOS</Text>
            }
          </TouchableOpacity>
          <Text style={styles.sosBtnHint}>Hold firmly and tap to send</Text>
        </View>

        {/* Message input */}
        <View style={styles.messageCard}>
          <Text style={styles.label}>Emergency Message</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
            placeholder="Describe your emergency..."
            placeholderTextColor={COLORS.gray400}
          />
        </View>

        {/* Location status */}
        {locationStatus !== "idle" && (
          <View style={[styles.locStatus, locationStatus === "denied" && { backgroundColor: COLORS.dangerBg }]}>
            <Text style={{ color: locationStatus === "ok" ? COLORS.success : locationStatus === "denied" ? COLORS.danger : COLORS.warning, fontWeight: "600", fontSize: 13 }}>
              {locationStatus === "fetching" ? "📡 Fetching GPS location..." : locationStatus === "ok" ? "✅ GPS location attached" : "⚠️ Location access denied — alert sent without GPS"}
            </Text>
          </View>
        )}

        {/* Active alerts */}
        {activeAlerts.length > 0 && (
          <View style={styles.activeBox}>
            <Text style={styles.activeTitle}>⚠️ Active SOS Alerts</Text>
            {activeAlerts.map((a) => (
              <View key={a.id} style={styles.activeRow}>
                <Text style={styles.activeMsg}>{a.message}</Text>
                <Text style={styles.activeMeta}>{new Date(a.created_at).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Emergency numbers */}
        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>Direct Emergency Contacts</Text>
          {[["🚔 Police", "100"], ["🚑 Ambulance", "102"], ["♀️ Women Helpline", "1091"], ["👶 Child Helpline", "1098"], ["🆘 National Emergency", "112"]].map(([name, num]) => (
            <View key={num} style={styles.emergencyRow}>
              <Text style={styles.emergencyName}>{name}</Text>
              <Text style={styles.emergencyNum}>{num}</Text>
            </View>
          ))}
        </View>

        {/* History */}
        {!loadingAlerts && alerts.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>SOS History ({alerts.length})</Text>
            {alerts.map((a) => (
              <View key={a.id} style={[styles.histRow, a.is_active && { borderLeftColor: COLORS.danger, backgroundColor: "#fff5f5" }]}>
                <View style={[styles.histBadge, { backgroundColor: a.is_active ? COLORS.danger : COLORS.success }]}>
                  <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: "700" }}>{a.is_active ? "ACTIVE" : "RESOLVED"}</Text>
                </View>
                <Text style={styles.histMsg} numberOfLines={2}>{a.message}</Text>
                <Text style={styles.histDate}>{new Date(a.created_at).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray50 },
  scroll: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: "800", color: COLORS.danger, textAlign: "center" },
  sub: { fontSize: 13, color: COLORS.gray500, textAlign: "center", marginTop: 6, marginBottom: 28 },
  sosBtnWrapper: { alignItems: "center", marginBottom: 24 },
  sosBtn: {
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: COLORS.danger,
    alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.danger, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 16,
  },
  sosBtnText: { fontSize: 30, color: COLORS.white, fontWeight: "900", textAlign: "center" },
  sosBtnHint: { marginTop: 12, fontSize: 12, color: COLORS.gray400 },
  messageCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, ...SHADOW.sm },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.gray700, marginBottom: 8 },
  messageInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    padding: 12, fontSize: 14, color: COLORS.text, minHeight: 80, textAlignVertical: "top",
  },
  locStatus: {
    backgroundColor: COLORS.successBg, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 12, alignItems: "center",
  },
  activeBox: {
    backgroundColor: "#fff1f2", borderRadius: RADIUS.lg, padding: 16,
    borderWidth: 1.5, borderColor: "#fecdd3", marginBottom: 16,
  },
  activeTitle: { color: COLORS.danger, fontWeight: "700", fontSize: 14, marginBottom: 10 },
  activeRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#fecdd3" },
  activeMsg: { fontSize: 14, color: COLORS.gray700, fontWeight: "500" },
  activeMeta: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  emergencyCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, marginBottom: 16, ...SHADOW.sm },
  emergencyTitle: { fontSize: 14, fontWeight: "700", color: COLORS.gray700, marginBottom: 10 },
  emergencyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  emergencyName: { fontSize: 14, color: COLORS.gray600 },
  emergencyNum: { fontSize: 14, fontWeight: "700", color: COLORS.danger },
  historyCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, ...SHADOW.sm },
  historyTitle: { fontSize: 14, fontWeight: "700", color: COLORS.gray700, marginBottom: 10 },
  histRow: {
    paddingVertical: 10, paddingLeft: 10, borderLeftWidth: 3,
    borderLeftColor: COLORS.success, marginBottom: 8, borderRadius: 4,
  },
  histBadge: { alignSelf: "flex-start", borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 4 },
  histMsg: { fontSize: 13, color: COLORS.gray700 },
  histDate: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
});
