// app/user/AIDesigner.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useSubscriptionType from "../../services/useSubscriptionType";
import BottomNavbar from "../components/BottomNav";


export default function AIDesigner() {
  const router = useRouter();
  const subType = useSubscriptionType();


  // Mock chat summaries for history
  const [chatSummaries, setChatSummaries] = useState({
    design: [
      { id: "1", title: "Living Room Design", lastMessage: "Great! I suggest neutral colors...", date: "2025-11-17" },
      { id: "2", title: "Workspace Redesign", lastMessage: "Consider adding a small desk...", date: "2025-11-15" },
    ],
    customize: [
      { id: "1", title: "Bedroom Layout", lastMessage: "Try moving the bed to the corner...", date: "2025-11-16" },
    ],
  });

  // Open chat screen for top card
  const openChatScreen = (mode) => {
    router.push(`/User/AIDesignerChat?tab=${mode}&chatId=new`);
  };

  // Open chat for history item
  const openChatHistory = (tab, chatId) => {
    router.push(`/User/AIDesignerChat?tab=${tab}&chatId=${chatId}`);
  };

  return (
    <View style={styles.page}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Top Cards (stacked vertically) */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => openChatScreen("design")}
          >
            <Ionicons name="color-palette" size={30} color="#0F3E48" />
            <Text style={styles.cardText}>Design with AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => openChatScreen("customize")}
          >
            <Ionicons name="construct-outline" size={30} color="#0F3E48" />
            <Text style={styles.cardText}>Customize with AI</Text>
          </TouchableOpacity>
        </View>

        {/* History Title */}
        <Text style={styles.historyTitle}>History</Text>

        {/* Chat Summaries */}
        <ScrollView style={styles.historyContainer} showsVerticalScrollIndicator={false}>
          {chatSummaries.design.concat(chatSummaries.customize).map((chat) => (
            <TouchableOpacity
              key={`${chat.id}-${chat.title}`}
              style={styles.historyItem}
              onPress={() =>
                openChatHistory(
                  chatSummaries.design.includes(chat) ? "design" : "customize",
                  chat.id
                )
              }
            >
              <Text style={styles.historyItemTitle}>{chat.title}</Text>
              <Text style={styles.historyItemSnippet}>{chat.lastMessage}</Text>
              <Text style={styles.historyItemDate}>{chat.date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Navbar */}
      <BottomNavbar subType={subType} />
      </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F3F9FA" },
  container: { flex: 1, paddingHorizontal: 15, paddingTop: 50 },
  
  // Stack cards vertically
  cardsContainer: { 
    flexDirection: "column", 
    justifyContent: "flex-start", 
    marginBottom: 15, 
    gap: 10, // spacing between cards
  },

  card: {
    height: 100,
    backgroundColor: "#FFF",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  cardText: { marginTop: 8, fontWeight: "600", color: "#0F3E48", textAlign: "center" },

  historyTitle: { fontSize: 20, fontWeight: "600", color: "#0F3E48", marginBottom: 10 },
  historyContainer: { flex: 1, marginBottom: 70 }, // leave space for bottom navbar
  historyItem: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  historyItemTitle: { fontWeight: "700", color: "#0F3E48", fontSize: 16 },
  historyItemSnippet: { color: "#4A6B70", fontSize: 13, marginTop: 3 },
  historyItemDate: { color: "#AAA", fontSize: 12, marginTop: 2, textAlign: "right" },
});
