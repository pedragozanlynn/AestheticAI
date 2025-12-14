import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Linking
} from "react-native";
import { db } from "../../config/firebase";
import BottomNavbar from "../components/BottomNav";
import { useRouter } from "expo-router";

export default function Consultantst() {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
            <Text style={styles.name}>{c.fullName}</Text>
            <Text style={styles.email}>{c.email}</Text>

            {/* ---------- PORTFOLIO FILE INDICATOR ---------- */}
            <Text style={{ marginTop: 5 }}>
              Portfolio:{" "}
              {c.portfolioURL ? (
                <Text style={{ color: "green", fontWeight: "600" }}>
                  Available
                </Text>
              ) : (
                <Text style={{ color: "red" }}>None</Text>
              )}
            </Text>

            {/* ---------- VIEW PORTFOLIO BUTTON ---------- */}
            {c.portfolioURL && (
              <TouchableOpacity
                style={styles.portfolioBtn}
                onPress={() => Linking.openURL(c.portfolioURL)}
              >
                <Text style={styles.portfolioText}>VIEW PORTFOLIO FILE</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.status}>
              Status:{" "}
              <Text
                style={{
                  color:
                    c.status === "accepted"
                      ? "green"
                      : c.status === "rejected"
                      ? "red"
                      : "orange",
                  fontWeight: "bold",
                }}
              >
                {c.status || "pending"}
              </Text>
            </Text>

            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() =>
                router.push({
                  pathname: "Admin//ConsultantDetails",
                  params: { data: JSON.stringify(c) },
                })
              }
            >
              <Text style={styles.viewText}>VIEW</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

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
  name: { fontSize: 18, fontWeight: "bold", color: "#0F3E48" },
  email: { color: "#333", marginBottom: 5 },

  /* Portfolio button */
  portfolioBtn: {
    backgroundColor: "#2176AE",
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  portfolioText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
  },

  status: { marginVertical: 10 },
  viewBtn: {
    backgroundColor: "#0F3E48",
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
  },
});
