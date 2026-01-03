import React, { useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

export default function RatingModal({
  visible,
  onSubmit,
  onClose,
  reviewerName = "Anonymous",
}) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(0);
      setFeedback("");
      setLoading(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (rating === 0 || loading) return;

    setLoading(true);
    try {
      const result = await onSubmit({
        rating,
        feedback: feedback || "",
        reviewerName,
      });

      if (result !== false) onClose?.();
      else alert("Failed to submit rating.");
    } catch (err) {
      console.log("Rating submit error:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>How was your consultation?</Text>
          <Text style={styles.subtitle}>
            Your feedback helps us improve ✨
          </Text>

          {/* ⭐ STARS */}
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                disabled={loading}
                activeOpacity={0.7}
                onPress={() => setRating(num)}
              >
                <Text
                  style={[
                    styles.star,
                    rating >= num && styles.starActive,
                    loading && { opacity: 0.4 },
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 📝 FEEDBACK */}
          <TextInput
            style={styles.input}
            placeholder="Write something nice… (optional)"
            placeholderTextColor="#9AA6AC"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            maxLength={300}
            editable={!loading}
          />

          <Text style={styles.counter}>{feedback.length}/300</Text>

          {/* SUBMIT */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (loading || rating === 0) && { opacity: 0.5 },
            ]}
            disabled={loading || rating === 0}
            onPress={handleSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Rating</Text>
            )}
          </TouchableOpacity>

          {!loading && (
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Maybe later</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ================= AESTHETIC STYLES ================= */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,62,72,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    color: "#0F3E48",
  },

  subtitle: {
    fontSize: 13,
    color: "#6B7C85",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },

  stars: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },

  star: {
    fontSize: 38,
    color: "#D0D6DA",
    marginHorizontal: 6,
  },

  starActive: {
    color: "#FFD166",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E1E7EA",
    borderRadius: 14,
    padding: 14,
    minHeight: 80,
    backgroundColor: "#FAFCFD",
    color: "#333",
    textAlignVertical: "top",
  },

  counter: {
    fontSize: 11,
    color: "#8FA1AA",
    textAlign: "right",
    marginTop: 6,
  },

  submitBtn: {
    marginTop: 18,
    backgroundColor: "#0F3E48",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  submitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  cancelBtn: {
    marginTop: 12,
    paddingVertical: 10,
  },

  cancelText: {
    textAlign: "center",
    color: "#7A8A92",
    fontWeight: "600",
  },
});
