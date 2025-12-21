import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";
import BottomNavbar from "../components/BottomNav";
import { Ionicons } from "@expo/vector-icons"; // ✅ import Ionicons

export default function Homepage() {
  const router = useRouter();
  const [consultant, setConsultant] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load consultant profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const profileKey = keys.find((k) => k.startsWith("aestheticai:user-profile:"));
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

  // Load recent appointments & balance real-time
  useEffect(() => {
    if (!consultant) return;

    setLoading(true);

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("consultantId", "==", consultant.uid),
      orderBy("date", "desc"),
      limit(5)
    );
    const unsubAppointments = onSnapshot(appointmentsQuery, async (snapshot) => {
      const requests = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let userName = "Unknown User";
          if (data.userId) {
            try {
              const userDoc = await getDoc(doc(db, "users", data.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                userName = userData.fullName || userData.name || "Unnamed User";
              }
            } catch (err) {
              console.error("Error fetching user name:", err);
            }
          }
          return { id: docSnap.id, ...data, userName };
        })
      );
      setRecentRequests(requests);
    });

    const paymentsQuery = query(
      collection(db, "payments"),
      where("consultantId", "==", consultant.uid)
    );
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      let totalBalance = 0;
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        let amt = parseFloat(String(data.amount).replace(/[^0-9.-]+/g, "")) || 0;
        const type = (data.type || "").toLowerCase();
        if (type.includes("earning")) {
          amt *= 0.7;
        } else if (type.includes("withdraw")) {
          amt *= -1;
        }
        totalBalance += amt;
      });
      setBalance(totalBalance);
      setLoading(false);
    });

    return () => {
      unsubAppointments();
      unsubPayments();
    };
  }, [consultant]);

 const renderRequest = ({ item }) => (
  <View style={styles.requestItem}>
    <View style={{ flex: 1 }}>
      <Text style={styles.requestName}>{item.userName}</Text>
      <View style={styles.requestMeta}>
        {/* ✅ Time + Icon sa kaliwa */}
        <View style={styles.timeWrap}>
          <Text style={styles.requestTime}>{item.time}</Text>
        </View>

        {/* ✅ Date sa kanan */}
        <Text style={styles.requestDate}>{item.date}</Text>
      </View>
    </View>
  </View>
);



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
      {/* Welcome Row */}
<View style={styles.welcomeRow}>
  <View style={styles.greetWrap}>
  <Text style={styles.header}>Hi, {consultant.fullName}</Text>

  </View>
  <TouchableOpacity
    onPress={() => router.push("/User/EditProfile")}
    style={styles.editButton}
  >
    <Ionicons name="create" size={22} color="#3fa796" />
  </TouchableOpacity>
</View>
<Text style={styles.subtext}>
  {consultant.consultantType} – {consultant.specialization}
</Text>


      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View>
          <Text style={styles.balanceLabel}>Total Earnings</Text>
          <Text style={styles.balanceAmount}>₱ {balance.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push("/Consultant/EarningsScreen")}
        >
          <Text style={styles.viewAllTextButton}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Appointments */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Appointments</Text>
        <TouchableOpacity onPress={() => router.push("/Consultant/Requests")}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentRequests.length === 0 ? (
        <Text style={styles.placeholderText}>No recent appointments</Text>
      ) : (
        <FlatList
          data={recentRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          style={{ marginBottom: 20 }}
        />
      )}

      <BottomNavbar role="consultant" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F3F9FA", // softer neutral background
    paddingHorizontal: 20,
    paddingTop: 50, // breathing space at top
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  // Greeting row
  welcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    fontSize: 20,
    fontWeight: "800",
    color: "#912f56", // maroon accent (premium, elegant)
    letterSpacing: 0.6,
  },
  editButton: {
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: "#01579B",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  subtext: {
    fontSize: 15,
    color: "#607D8B",
    marginBottom: 22,
    fontStyle: "italic",
    letterSpacing: 0.3,
  },
  

  balanceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 22,
    borderRadius: 20,
    backgroundColor: "#01579B", // ✅ ocean blue background   
     marginBottom: 26,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  balanceLabel: { fontSize: 15, fontWeight: "600", color: "#BBDEFB" },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  viewAllButton: {
    backgroundColor: "#3fa796",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  viewAllTextButton: { color: "#fff", fontWeight: "700", fontSize: 13 },

 // ✅ Section Header
sectionHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
  marginTop: 18,
},
sectionTitle: {
  fontSize: 18,
  fontWeight: "700",
  color: "#912f56", // ocean blue accent
  letterSpacing: 0.5,
},
viewAllText: {
  fontSize: 13,
  fontWeight: "700",
  color: "#01579B", // maroon accent link
},

// ✅ Placeholder text
placeholderText: {
  fontSize: 14,
  color: "#90A4AE",
  marginTop: 10,
  marginBottom: 18,
  textAlign: "center",
  fontStyle: "italic",
},

requestItem: {
  flexDirection: "row",              // para may space for icon sa kanan
  justifyContent: "space-between",
  alignItems: "center",
  padding: 20,
  backgroundColor: "#FFFFFF",
  borderRadius: 20,
  marginBottom: 18,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
  borderLeftWidth: 5,
  borderLeftColor: "#912f56",        // maroon accent stripe
},

requestName: {
  fontSize: 17,
  fontWeight: "700",
  color: "#01579B", // ocean blue for names
  marginBottom: 8,
  letterSpacing: 0.4,
},

// Meta row for time + date
requestMeta: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

requestTime: {
  fontSize: 13,
  color: "#455A64",
},

requestDate: {
  fontSize: 13,
  color: "#455A64",
},

});
