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

  // 🔥 Reset state every time modal opens
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
      // ✅ MUST RETURN TRUE ON SUCCESS
      const result = await onSubmit({
        rating,
        feedback: feedback || "",
        reviewerName,
      });

      if (result !== false) {
        onClose?.(); // close modal permanently
      } else {
        alert("Failed to submit rating. Please try again.");
      }
    } catch (err) {
      console.log("Rating submit error:", err);
      alert("Something went wrong while submitting your rating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Rate your consultation</Text>

          {/* ⭐ STAR RATING */}
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                disabled={loading}
                onPress={() => setRating(num)}
              >
                <Text
                  style={[
                    styles.star,
                    rating >= num && styles.activeStar,
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
            placeholder="Write feedback (optional)"
            placeholderTextColor="#888"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            maxLength={300}
            editable={!loading}
          />

          <Text style={styles.counter}>{feedback.length}/300</Text>

          {/* ✅ SUBMIT */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (loading || rating === 0) && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={loading || rating === 0}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Rating</Text>
            )}
          </TouchableOpacity>

          {/* ❌ CANCEL */}
          {!loading && (
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 15,
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
  },
  star: {
    fontSize: 36,
    color: "#bbb",
    marginHorizontal: 6,
  },
  activeStar: {
    color: "#FFD700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    minHeight: 70,
    textAlignVertical: "top",
    marginTop: 10,
  },
  counter: {
    fontSize: 12,
    color: "#777",
    textAlign: "right",
    marginTop: 4,
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: "#0F3E48",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 10,
  },
  cancelText: {
    textAlign: "center",
    color: "#555",
    fontWeight: "600",
  },
});
