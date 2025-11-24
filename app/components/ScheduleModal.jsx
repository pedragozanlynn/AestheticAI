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
}) {
  const router = useRouter();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(
    new Date(new Date().setHours(new Date().getHours() + 1))
  );

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Format display time
  const formatTime = (time) =>
    time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Convert "10:00 AM" → Date object
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

  // VALIDATE SCHEDULE
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
    const end = endTime;

    const [amStart, amEnd] = match.am ? match.am.split(" - ") : [];
    const [pmStart, pmEnd] = match.pm ? match.pm.split(" - ") : [];

    const amStartDate = toDateTime(amStart);
    const amEndDate = toDateTime(amEnd);
    const pmStartDate = toDateTime(pmStart);
    const pmEndDate = toDateTime(pmEnd);

    const inAM =
      match.am &&
      start >= amStartDate &&
      end <= amEndDate;

    const inPM =
      match.pm &&
      start >= pmStartDate &&
      end <= pmEndDate;

    if (!inAM && !inPM) {
      setErrorMsg(
        `Not available during ${formatTime(start)} - ${formatTime(end)}.`
      );
    } else {
      setErrorMsg("");
    }
  }, [date, startTime, endTime]);

  // CONTINUE — PASS DATA THROUGH ROUTER
  const handleContinue = () => {
    if (errorMsg) return;

    const selectedDate = date.toISOString().split("T")[0];
    const timeRange = `${formatTime(startTime)} - ${formatTime(endTime)}`;

    onClose();

    router.push(
      `/User/BookConsultation?consultantId=${consultantId}&date=${selectedDate}&time=${timeRange}&notes=${encodeURIComponent(
        notes
      )}`
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>Set Consultation Schedule</Text>

          {/* DATE */}
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

          {/* START TIME */}
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.inputText}>
              ⏰ Start: {formatTime(startTime)}
            </Text>
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              onChange={(e, selected) => {
                setShowStartPicker(false);
                if (selected) {
                  setStartTime(selected);

                  // Auto adjust endTime = start + 1hr
                  const newEnd = new Date(selected);
                  newEnd.setHours(newEnd.getHours() + 1);
                  setEndTime(newEnd);
                }
              }}
            />
          )}

          {/* END TIME */}
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.inputText}>⏰ End: {formatTime(endTime)}</Text>
          </TouchableOpacity>

          {showEndPicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              display="default"
              onChange={(e, selected) => {
                setShowEndPicker(false);
                if (selected) setEndTime(selected);
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

          {/* ERROR MESSAGE */}
          {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

          {/* ACTION BUTTONS */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.continueBtn,
                errorMsg ? { backgroundColor: "#777" } : {},
              ]}
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    padding: 15,
    backgroundColor: "#F3F3F3",
    borderRadius: 10,
    marginBottom: 15,
  },
  inputText: {
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    backgroundColor: "#F3F3F3",
    padding: 15,
    minHeight: 90,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  error: {
    color: "red",
    marginBottom: 10,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    marginTop: 15,
    justifyContent: "space-between",
  },
  cancelBtn: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#ddd",
    width: "48%",
    alignItems: "center",
  },
  continueBtn: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#0F3E48",
    width: "48%",
    alignItems: "center",
  },
  cancelText: { fontSize: 16, color: "#444" },
  continueText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
});
