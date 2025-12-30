import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Calendar } from "react-native-calendars";
import { useRouter } from "expo-router";
import { db } from "../../config/firebase";

/* ================= DAYS ================= */
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function EditAvailability() {
  const router = useRouter();
  const uid = getAuth().currentUser?.uid;

  const [availability, setAvailability] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [saving, setSaving] = useState(false);

  /* ================= LOAD AVAILABILITY ================= */
  useEffect(() => {
    const loadAvailability = async () => {
      try {
        if (!uid) return;
        const snap = await getDoc(doc(db, "consultants", uid));
        if (snap.exists()) {
          setAvailability(snap.data().availability || []);
        }
      } catch (err) {
        console.log("Load availability error:", err);
      }
    };
    loadAvailability();
  }, []);

  /* ================= ADD DAY ================= */
  const addDay = () => {
    if (!selectedDay) return;

    if (availability.includes(selectedDay)) {
      Alert.alert("Already Added", "This day is already selected.");
      return;
    }

    setAvailability((prev) => [...prev, selectedDay]);
    setSelectedDay("");
  };

  /* ================= REMOVE DAY ================= */
  const removeDay = (day) => {
    setAvailability((prev) => prev.filter((d) => d !== day));
  };

  /* ================= SAVE ================= */
  const saveAvailability = async () => {
    if (availability.length === 0) {
      Alert.alert("Required", "Please select at least one day.");
      return;
    }

    try {
      setSaving(true);
      await updateDoc(doc(db, "consultants", uid), {
        availability,
      });

      Alert.alert("Success ✅", "Availability updated successfully.");
      router.back();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to update availability.");
    } finally {
      setSaving(false);
    }
  };

  /* ================= CALENDAR MARKING (HIGHLIGHT) ================= */
  const markedDates = useMemo(() => {
    const marks = {};
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayName = date.toLocaleDateString("en-US", {
        weekday: "long",
      });

      if (availability.includes(dayName)) {
        const key = date.toISOString().split("T")[0];
        marks[key] = {
          customStyles: {
            container: {
              backgroundColor: "#01579B", // ✅ brand highlight
              borderRadius: 8,
            },
            text: {
              color: "#fff",
              fontWeight: "700",
            },
          },
        };
      }
    }

    return marks;
  }, [availability]);

  /* ================= UI ================= */
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ===== HEADER ===== */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={router.back}>
          <Ionicons name="arrow-back" size={22} color="#0F3E48" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Edit Availability</Text>
          <Text style={styles.headerSubtitle}>
            Select days you are available
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ===== CALENDAR ===== */}
      <Calendar
        markingType="custom"
        markedDates={markedDates}
        theme={{
          todayTextColor: "#8f2f52",
          arrowColor: "#01579B",
          calendarBackground: "#E3F2FD", // ✅ colored background
        }}
      />

      {/* ===== PICKER ===== */}
      <View style={styles.card}>
        <Text style={styles.label}>Add Available Day</Text>

        <View style={styles.pickerBox}>
          <Picker
            selectedValue={selectedDay}
            onValueChange={setSelectedDay}
          >
            <Picker.Item label="Select day" value="" />
            {DAYS.map((d) => (
              <Picker.Item key={d} label={d} value={d} />
            ))}
          </Picker>
        </View>

        {selectedDay !== "" && (
          <TouchableOpacity style={styles.addBtn} onPress={addDay}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addText}>Add Day</Text>
          </TouchableOpacity>
        )}

        {/* SELECTED DAYS */}
        {availability.map((day) => (
          <View key={day} style={styles.dayItem}>
            <Text style={styles.dayText}>{day}</Text>
            <TouchableOpacity onPress={() => removeDay(day)}>
              <Ionicons name="close-circle" size={20} color="#C44569" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* ===== SAVE ===== */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={saveAvailability}
        disabled={saving}
      >
        <Ionicons name="save-outline" size={18} color="#fff" />
        <Text style={styles.saveText}>
          {saving ? "Saving..." : "Save Changes"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F9FA",
    padding: 16,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F3E48",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#777",
  },
  divider: {
    height: 1,
    backgroundColor: "#E4E6EB",
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E1E8EA",
  },

  label: {
    fontWeight: "700",
    marginBottom: 6,
    color: "#2c4f4f",
  },

  pickerBox: {
    borderWidth: 1,
    borderColor: "#dce3ea",
    borderRadius: 14,
    backgroundColor: "#fff",
    marginBottom: 10,
  },

  addBtn: {
    flexDirection: "row",
    backgroundColor: "#01579B",
    padding: 12,
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 12,
  },
  addText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "700",
  },

  dayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    marginBottom: 8,
  },
  dayText: {
    fontWeight: "600",
    color: "#01579B",
  },

  saveBtn: {
    marginTop: 24,
    backgroundColor: "#01579B",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  saveText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});
