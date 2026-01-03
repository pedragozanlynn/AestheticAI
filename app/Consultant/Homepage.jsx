import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";
import BottomNavbar from "../components/BottomNav";

export default function Homepage() {
  const router = useRouter();
  const [consultant, setConsultant] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD CONSULTANT PROFILE ================= */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const profileKey = keys.find((k) =>
          k.startsWith("aestheticai:user-profile:")
        );
        if (profileKey) {
          const data = await AsyncStorage.getItem(profileKey);
          setConsultant(JSON.parse(data));
        }
      } catch (err) {
        console.error("Error loading consultant profile:", err);
      }
    };
    loadProfile();
  }, []);

  /* ================= DATA ================= */
  useEffect(() => {
    if (!consultant) return;

    setLoading(true);

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("consultantId", "==", consultant.uid),
      orderBy("appointmentAt", "desc"),
      limit(3)
    );

    const unsubAppointments = onSnapshot(
      appointmentsQuery,
      async (snapshot) => {
        const requests = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            let userName = "Unknown User";

            if (data.userId) {
              try {
                const userDoc = await getDoc(
                  doc(db, "users", data.userId)
                );
                if (userDoc.exists()) {
                  const u = userDoc.data();
                  userName = u.fullName || u.name || "Unnamed User";
                }
              } catch {}
            }

            return { id: docSnap.id, ...data, userName };
          })
        );

        setRecentRequests(requests);
        setLoading(false);
      }
    );

    const paymentsQuery = query(
      collection(db, "payments"),
      where("consultantId", "==", consultant.uid)
    );

    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      let totalBalance = 0;
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        totalBalance += Number(data.amount) || 0;
      });
      setBalance(totalBalance);
    });

    return () => {
      unsubAppointments();
      unsubPayments();
    };
  }, [consultant]);

  /* ================= RENDER ================= */
  if (!consultant || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0D47A1" />
        <Text>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* GREETING */}
      <View style={styles.welcomeRow}>
        <Text style={styles.header}>Hi, {consultant.fullName}</Text>

      </View>

      <Text style={styles.subtext}>
        {consultant.consultantType} – {consultant.specialization}
      </Text>

      {/* CURRENT BALANCE */}
      <View style={styles.balanceCard}>
        <View>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            ₱ {balance.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.withdrawBtn}
          onPress={() => router.push("/Consultant/EarningsScreen")}
        >
          <Text style={styles.withdrawText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
  <TouchableOpacity
    style={[styles.actionCard, styles.actionCardTeal]}
    onPress={() => router.push("/Consultant/EditProfile")}
  >
    <Image
      source={require("../../assets/edit.png")}
      style={styles.actionIcon}
    />
    <Text style={styles.actionText}>Edit Profile</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.actionCard, styles.actionCardPurple]}
    onPress={() => router.push("/Consultant/EditAvailability")}
  >
    <Image
      source={require("../../assets/schedule.png")}
      style={styles.actionIcon}
    />
    <Text style={styles.actionText}>Manage Availability</Text>
  </TouchableOpacity>
</View>


      {/* RECENT APPOINTMENTS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Appointments</Text>
        <TouchableOpacity
          onPress={() => router.push("/Consultant/Requests")}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentRequests.length === 0 ? (
        <Text style={styles.placeholderText}>
          No recent appointments
        </Text>
      ) : (
        <FlatList
          data={recentRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.requestItem}>
              <Text style={styles.requestName}>{item.userName}</Text>
              <View style={styles.requestMeta}>
                <Text style={styles.requestTime}>
                  {item.appointmentAt?.toDate().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Text style={styles.requestDate}>
                  {item.appointmentAt?.toDate().toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      <BottomNavbar role="consultant" />
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F9FA",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  welcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: { fontSize: 20, fontWeight: "800", color: "#912f56" },
  editButton: { padding: 6 },

  subtext: {
    fontSize: 15,
    color: "#607D8B",
    marginBottom: 22,
    fontStyle: "italic",
  },

  balanceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 22,
    borderRadius: 20,
    backgroundColor: "#01579B",
    marginBottom: 18,
  },
  balanceLabel: { fontSize: 15, color: "#BBDEFB" },
  balanceAmount: { fontSize: 28, fontWeight: "900", color: "#FFF" },

  withdrawBtn: {
    backgroundColor: "#3fa796",
    paddingHorizontal: 15,
    marginTop: 12,
    height: 34,              // ✅ ITO ANG GAME CHANGER
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  
  withdrawText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,            // ⬇️ maliit pero readable
    lineHeight: 14,          // ✅ para di humila ng height
  },
  
  

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 6,     // ⬇️ from 10
    marginTop: 2,            // ⬇️ from 4
    marginBottom: 20,        // ⬇️ from 24
  },
  
  actionCard: {
    flex: 1,
    margin: 6,
    height: 90,              // ⬇️ from 110 ✅
    borderRadius: 14,        // ⬇️ from 16
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  
  
  actionCardTeal: {
    backgroundColor: "#e0f7fa",
  },
  
  actionCardPurple: {
    backgroundColor: "#ede7f6",
  },
  
  actionText: {
    fontWeight: "900",
    fontSize: 12,
    marginTop: 6,
    color: "#2c4f4f",
  },

  
  actionIcon: {
    width: 36,
    height: 36,
    marginBottom: 6,
    resizeMode: "contain",
  },
  

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#912f56",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#01579B",
  },

  placeholderText: {
    textAlign: "center",
    color: "#90A4AE",
    fontStyle: "italic",
  },

  requestItem: {
    backgroundColor: "#FFF",
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#912f56",
  },
  requestName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#01579B",
    marginBottom: 6,
  },
  requestMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  requestTime: { fontSize: 13, color: "#455A64" },
  requestDate: { fontSize: 13, color: "#455A64" },
});
