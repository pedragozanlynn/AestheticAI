import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
    Alert,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../config/firebase";

export default function ConsultantDetailsModal({ visible, onClose, data }) {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (status) => {
    if (!data.id) return Alert.alert("Error", "Document ID is missing.");
    setUpdating(true);

    try {
      await updateDoc(doc(db, "consultants", data.id), { status });
      Alert.alert("Success", `Consultant ${status.toUpperCase()}!`);
      onClose();
    } catch (error) {
      console.error("Firestore update error:", error);
      Alert.alert("Error", "Unable to update status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Text style={styles.title}>{data.fullName}</Text>

            {/* Info box */}
            <View style={styles.box}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{data.email}</Text>

              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{data.address}</Text>

              <Text style={styles.label}>Consultant Type</Text>
              <Text style={styles.value}>{data.consultantType}</Text>

              <Text style={styles.label}>Education</Text>
              <Text style={styles.value}>{data.education}</Text>

              <Text style={styles.label}>Specialization</Text>
              <Text style={styles.value}>{data.specialization}</Text>

              <Text style={styles.label}>Portfolio File</Text>
              {data.portfolioURL ? (
                <TouchableOpacity onPress={() => Linking.openURL(data.portfolioURL)}>
                  <Text style={styles.link}>📁 Open Portfolio File</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.noPortfolio}>No portfolio uploaded</Text>
              )}

              <Text style={styles.label}>Status</Text>
              <Text style={styles.status}>{data.status || "pending"}</Text>
            </View>

            {/* Action buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.acceptBtn]}
                onPress={() => handleUpdate("accepted")}
                disabled={updating}
              >
                <Text style={styles.btnText}>ACCEPT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.rejectBtn]}
                onPress={() => handleUpdate("rejected")}
                disabled={updating}
              >
                <Text style={styles.btnText}>REJECT</Text>
              </TouchableOpacity>
            </View>

            {/* Close */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F3E48",
    marginBottom: 15,
    textAlign: "center",
  },
  box: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    marginTop: 10,
    fontWeight: "600",
    color: "#0F3E48",
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    color: "#333",
    marginTop: 2,
  },
  link: {
    color: "#0066cc",
    textDecorationLine: "underline",
    marginTop: 5,
    fontSize: 14,
    fontWeight: "500",
  },
  noPortfolio: {
    color: "red",
    fontSize: 13,
    marginTop: 4,
  },
  status: {
    fontWeight: "bold",
    marginTop: 5,
    fontSize: 14,
    color: "#333",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  acceptBtn: {
    backgroundColor: "#2ecc71",
  },
  rejectBtn: {
    backgroundColor: "#e74c3c",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  closeBtn: {
    marginTop: 12,
    backgroundColor: "#ddd",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: {
    fontWeight: "600",
    fontSize: 15,
    color: "#333",
  },
});
