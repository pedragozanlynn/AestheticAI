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

export default function ScheduleModal({
  visible,
  onClose,
  consultantId,
  availability = [],
  sessionFee = 999, // Default session fee = 999
}) {
  const router = useRouter();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [startTime, setStartTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);

  const [notes, setNotes] = useState(""); // Notes for consultant/payment
  const [errorMsg, setErrorMsg] = useState("");

  const formatTime = (time) =>
    time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const toDateTime = (timeStr) => {
    if (!timeStr) return null;
    const [t, modifier] = timeStr.split(" ");
    let [hours, minutes] = t.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const getDayName = (dateObj) =>
    dateObj.toLocaleDateString("en-US", { weekday: "long" });

  useEffect(() => {
    if (!availability || availability.length === 0) {
      setErrorMsg("Consultant has no available schedule.");
      return;
    }

    const dayName = getDayName(date);
    const match = availability.find(
      (a) => a.day.toLowerCase() === dayName.toLowerCase()
    );

    if (!match) {
      setErrorMsg(`Consultant is not available on ${dayName}.`);
      return;
    }

    const start = startTime;

    const [amStart, amEnd] = match.am ? match.am.split(" - ") : [];
    const [pmStart, pmEnd] = match.pm ? match.pm.split(" - ") : [];

    const amStartDate = toDateTime(amStart);
    const amEndDate = toDateTime(amEnd);
    const pmStartDate = toDateTime(pmStart);
    const pmEndDate = toDateTime(pmEnd);

    const inAM = match.am && start >= amStartDate && start <= amEndDate;
    const inPM = match.pm && start >= pmStartDate && start <= pmEndDate;

    if (!inAM && !inPM) {
      setErrorMsg(
        `Not available at ${formatTime(start)}. Please choose another time.`
      );
    } else {
      setErrorMsg("");
    }
  }, [date, startTime]);

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

  return (
    <Modal visible={visible} transparent animationType="slide">
    <View style={styles.overlay}>
      <View style={styles.modalBox}>
        <Text style={styles.title}>Set Consultation Schedule</Text>
  
        {/* DATE PICKER */}
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.inputText}>📅 {date.toDateString()}</Text>
        </TouchableOpacity>
  
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(e, selected) => {
              setShowDatePicker(false);
              if (selected) setDate(selected);
            }}
          />
        )}
  
        {/* START TIME PICKER */}
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowStartPicker(true)}
        >
          <Text style={styles.inputText}>⏰ Start: {formatTime(startTime)}</Text>
        </TouchableOpacity>
  
        {showStartPicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            display="default"
            onChange={(e, selected) => {
              setShowStartPicker(false);
              if (selected) setStartTime(selected);
            }}
          />
        )}
  
        {/* NOTES */}
        <TextInput
          style={styles.textArea}
          placeholder="Notes for consultant / payment (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
  
        {/* PAYMENT NOTE BELOW NOTES */}
        <Text style={styles.paymentNote}>
          💰 This session has a fee of ₱{sessionFee}.
        </Text>
  
        {/* ERROR MESSAGE */}
        {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
  
        {/* ACTION BUTTONS */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            style={[styles.continueBtn, errorMsg ? { backgroundColor: "#777" } : {}]}
            onPress={handleContinue}
            disabled={!!errorMsg}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
  
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  paymentNote: {
    color: "#0F3E48",
    fontWeight: "bold",
    marginBottom: 15,
    fontSize: 16,
  },
  input: { padding: 15, backgroundColor: "#F3F3F3", borderRadius: 10, marginBottom: 15 },
  inputText: { fontSize: 16, color: "#333" },
  textArea: { backgroundColor: "#F3F3F3", padding: 15, minHeight: 90, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  error: { color: "red", marginBottom: 10, fontWeight: "bold" },
  row: { flexDirection: "row", marginTop: 15, justifyContent: "space-between" },
  cancelBtn: { padding: 12, borderRadius: 10, backgroundColor: "#ddd", width: "48%", alignItems: "center" },
  continueBtn: { padding: 12, borderRadius: 10, backgroundColor: "#0F3E48", width: "48%", alignItems: "center" },
  cancelText: { fontSize: 16, color: "#444" },
  continueText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
});
