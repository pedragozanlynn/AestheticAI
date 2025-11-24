import { doc, updateDoc } from "firebase/firestore";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { db } from "../../config/firebase";
import { useLocalSearchParams } from "expo-router";

export default function ConsultantDetails() {
  const params = useLocalSearchParams();
  const data = JSON.parse(params.data); // ← convert string to object

  const handleUpdate = async (status) => {
    try {
      await updateDoc(doc(db, "consultants", data.id), { status });
      Alert.alert("Success", `Consultant ${status}!`);
    } catch (error) {
      Alert.alert("Error", "Unable to update.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{data.fullName}</Text>

      <View style={styles.box}>
        <Text style={styles.label}>Email:</Text>
        <Text>{data.email}</Text>

        <Text style={styles.label}>Address:</Text>
        <Text>{data.address}</Text>

        <Text style={styles.label}>Consultant Type:</Text>
        <Text>{data.consultantType}</Text>

        <Text style={styles.label}>Education:</Text>
        <Text>{data.education}</Text>

        <Text style={styles.label}>Specialization:</Text>
        <Text>{data.specialization}</Text>

        {data.portfolioURL && (
          <>
            <Text style={styles.label}>Portfolio:</Text>
            <TouchableOpacity onPress={() => Linking.openURL(data.portfolioURL)}>
              <Text style={styles.link}>Open Portfolio</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.label}>Status:</Text>
        <Text style={styles.status}>{data.status || "pending"}</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#2ecc71" }]}
          onPress={() => handleUpdate("accepted")}
        >
          <Text style={styles.btnText}>ACCEPT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#e74c3c" }]}
          onPress={() => handleUpdate("rejected")}
        >
          <Text style={styles.btnText}>REJECT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: "#fff" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0F3E48",
    marginBottom: 20,
    textAlign: "center",
  },
  box: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 10,
  },
  label: { marginTop: 10, fontWeight: "bold", color: "#0F3E48" },
  link: { color: "#0066cc", textDecorationLine: "underline" },
  status: { fontWeight: "bold", marginTop: 5 },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  btn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  btnText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});
