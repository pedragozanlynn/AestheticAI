import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/* ---------------- HELPERS ---------------- */

const safeLower = (v) => (typeof v === "string" ? v.toLowerCase() : "");

const parseTimeRange = (range) => {
  if (!range || typeof range !== "string") return null;
  const [start, end] = range.split(" - ");
  if (!start || !end) return null;
  return { start, end };
};

const toDateTime = (timeStr) => {
  if (!timeStr) return null;
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const PRIMARY = "#2c4f4f";

/* ---------------- COMPONENT ---------------- */

export default function ScheduleModal({
  visible,
  onClose,
  consultantId,
  availability = [],
  sessionFee = 999,
}) {
  const router = useRouter();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [startTime, setStartTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);

  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const formatTime = (t) =>
    t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getDayName = (d) =>
    d.toLocaleDateString("en-US", { weekday: "long" });

  /* ---------------- VALIDATION ---------------- */

  useEffect(() => {
    if (!availability.length) {
      setErrorMsg("Consultant has no available schedule.");
      return;
    }

    const dayName = getDayName(date);

    const match = availability.find((a) =>
      typeof a === "string"
        ? safeLower(a) === safeLower(dayName)
        : safeLower(a?.day) === safeLower(dayName)
    );

    if (!match) {
      setErrorMsg(`Not available on ${dayName}.`);
      return;
    }

    if (!match.am && !match.pm) {
      setErrorMsg("");
      return;
    }

    const start = startTime;
    let valid = false;

    const am = parseTimeRange(match.am);
    const pm = parseTimeRange(match.pm);

    if (am) {
      const s = toDateTime(am.start);
      const e = toDateTime(am.end);
      if (s && e && start >= s && start <= e) valid = true;
    }

    if (pm) {
      const s = toDateTime(pm.start);
      const e = toDateTime(pm.end);
      if (s && e && start >= s && start <= e) valid = true;
    }

    setErrorMsg(valid ? "" : "Choose a time within consultant availability.");
  }, [date, startTime, availability]);

  /* ---------------- SUBMIT ---------------- */

  const handleContinue = () => {
    if (errorMsg) return;

    const selectedDate = date.toISOString().split("T")[0];
    const time = formatTime(startTime);

    onClose();

    router.push(
      `/User/BookConsultation?consultantId=${consultantId}&date=${selectedDate}&time=${time}&notes=${encodeURIComponent(
        notes
      )}&fee=${sessionFee}`
    );
  };

  /* ---------------- UI ---------------- */

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Schedule Consultation</Text>
          </View>

          <View style={styles.divider} />

          {/* DATE */}
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={18} color={PRIMARY} />
            <Text style={styles.inputText}>{date.toDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              minimumDate={new Date()}
              onChange={(e, selected) => {
                setShowDatePicker(false);
                if (selected) setDate(selected);
              }}
            />
          )}

          {/* TIME */}
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="time" size={18} color={PRIMARY} />
            <Text style={styles.inputText}>
              Start Time: {formatTime(startTime)}
            </Text>
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              onChange={(e, selected) => {
                setShowStartPicker(false);
                if (selected) setStartTime(selected);
              }}
            />
          )}

          {/* NOTES */}
          <TextInput
            style={styles.textArea}
            placeholder="Notes for consultant (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* SESSION FEE MESSAGE (YOUR TEXT) */}
          <View style={styles.feeReminder}>
            <Ionicons name="information-circle" size={20} color={PRIMARY} />
            <Text style={styles.feeDesc}>
              A one-time payment of{" "}
              <Text style={styles.bold}>₱{sessionFee}</Text> is required.
              {"\n"}
              After payment, your consultation chat will be{" "}
              <Text style={styles.bold}>open for 12 hours only</Text>.
              {"\n"}
              Please complete your discussion within this time.
            </Text>
          </View>

          {!!errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#c62828" />
              <Text style={styles.error}>{errorMsg}</Text>
            </View>
          )}

          {/* ACTIONS */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.continueBtn,
                errorMsg && styles.disabledBtn,
              ]}
              disabled={!!errorMsg}
              onPress={handleContinue}
            >
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalBox: {
    backgroundColor: "#faf9f6",
    padding: 22,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: PRIMARY,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: "#f1f3f4",
    borderRadius: 14,
    marginBottom: 14,
  },
  inputText: { fontSize: 15 },
  textArea: {
    backgroundColor: "#f1f3f4",
    padding: 14,
    minHeight: 90,
    borderRadius: 14,
    marginBottom: 14,
    fontSize: 15,
  },
  feeReminder: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#e6f0ee",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  feeDesc: {
    fontSize: 14,
    color: "#3b4f4f",
    lineHeight: 20,
    flex: 1,
  },
  bold: {
    fontWeight: "800",
    color: PRIMARY,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  error: { color: "#c62828", fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelBtn: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#e0e0e0",
    width: "48%",
    alignItems: "center",
  },
  continueBtn: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    width: "48%",
    alignItems: "center",
  },
  disabledBtn: {
    backgroundColor: "#9ea7a7",
  },
  cancelText: { fontSize: 15 },
  continueText: { fontSize: 15, color: "#fff", fontWeight: "800" },
});
