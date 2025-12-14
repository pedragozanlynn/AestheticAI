import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RatingModal({ visible, onSubmit, onClose, reviewerName }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    setLoading(true);

    // Pass reviewerName safely
    const success = await onSubmit(rating, feedback || "", reviewerName || "Anonymous");

    setLoading(false);

    if (success) {
      setRating(0);
      setFeedback("");
      onClose && onClose();
    } else {
      alert("Failed to submit rating. Please try again.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Rate your consultation</Text>

          {/* ⭐ STARS */}
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
                    loading && { opacity: 0.5 },
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ⭐ FEEDBACK TEXT FIELD */}
          <TextInput
            style={styles.input}
            placeholder="Write feedback (optional)"
            placeholderTextColor="#888"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            editable={!loading}
          />

          {/* Character Counter */}
          <Text style={styles.counter}>{feedback.length}/300</Text>

          {/* ⭐ SUBMIT BUTTON */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              loading && { opacity: 0.6 },
              rating === 0 && { opacity: 0.4 },
            ]}
            onPress={handleSubmit}
            disabled={loading || rating === 0}
          >
            <Text style={styles.submitText}>
              {loading ? "Submitting..." : "Submit Rating"}
            </Text>
          </TouchableOpacity>

          {/* ⭐ CANCEL BUTTON */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

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
    borderRadius: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  star: {
    fontSize: 35,
    color: "#aaa",
    marginHorizontal: 5,
  },
  activeStar: {
    color: "#FFD700",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ddd",
    padding: 10,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: "top",
    marginTop: 10,
  },
  counter: {
    marginTop: 5,
    fontSize: 12,
    color: "#777",
    textAlign: "right",
  },
  submitBtn: {
    marginTop: 15,
    backgroundColor: "#0F3E48",
    padding: 12,
    borderRadius: 10,
  },
  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  cancelBtn: {
    marginTop: 10,
    padding: 10,
  },
  cancelText: {
    color: "#333",
    textAlign: "center",
  },
});
