import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";
import BottomNavbar from "../components/BottomNav";
import ConsultantDetailsModal from "../components/ConsultantDetailsModal";

export default function Consultantst() {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "consultants"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setConsultants(list);
      } catch (error) {
        Alert.alert("Error", "Failed to load consultant data.");
      } finally {
        setLoading(false);
      }
    };

    fetchConsultants();
  }, []);

  const openModal = (consultant) => {
    setSelectedConsultant(consultant);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0F3E48" />
        <Text>Loading consultants...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingBottom: 90 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Consultant Applications</Text>

        {consultants.map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={styles.row}>
              {/* ✅ Info sa kaliwa */}
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{c.fullName}</Text>
                  {c.status === "accepted" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="green"
                      style={styles.checkIcon}
                    />
                  )}
                </View>
                <Text style={styles.email}>{c.email}</Text>
              </View>

              {/* ✅ Image sa kanan, tap to open modal */}
              <TouchableOpacity onPress={() => openModal(c)}>
                <Image
                  source={require("../../assets/image.png")}
                  style={styles.imageRight}
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal */}
      {selectedConsultant && (
        <ConsultantDetailsModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          data={selectedConsultant} // ✅ pass object, not JSON string
        />
      )}

      <BottomNavbar role="admin" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0F3E48",
    marginVertical: 15,
  },
  card: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // distribute left info and right image
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: { fontSize: 18, fontWeight: "bold", color: "#0F3E48" },
  checkIcon: {
    marginLeft: 6,
  },
  email: { color: "#666", fontSize: 13 },
  imageRight: {
    width: 40,
    height: 40,
    resizeMode: "cover", // rectangular image
  },
});
