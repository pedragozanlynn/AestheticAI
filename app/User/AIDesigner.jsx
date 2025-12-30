// app/user/AIDesigner.jsx
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
  Image,
} from "react-native";
import useSubscriptionType from "../../services/useSubscriptionType";
import BottomNavbar from "../components/BottomNav";

export default function AIDesigner() {
  const router = useRouter();
  const subType = useSubscriptionType();

  // ✅ Mock chat summaries (STATIC – no UI jump)
  const [chatSummaries] = useState({
    design: [
      {
        id: "1",
        title: "Living Room Design",
        lastMessage: "Great! I suggest neutral colors...",
        date: "2025-11-17",
      },
      {
        id: "2",
        title: "Workspace Redesign",
        lastMessage: "Consider adding a small desk...",
        date: "2025-11-15",
      },
    ],
    customize: [
      {
        id: "1",
        title: "Bedroom Layout",
        lastMessage: "Try moving the bed to the corner...",
        date: "2025-11-16",
      },
    ],
  });

  const openChatScreen = (mode) => {
    router.push(`/User/AIDesignerChat?tab=${mode}&chatId=new`);
  };

  const openChatHistory = (tab, chatId) => {
    router.push(`/User/AIDesignerChat?tab=${tab}&chatId=${chatId}`);
  };

  // ✅ flattened history ONCE (prevents rerender reflow)
  const historyList = [
    ...chatSummaries.design.map((c) => ({ ...c, tab: "design" })),
    ...chatSummaries.customize.map((c) => ({ ...c, tab: "customize" })),
  ];

  return (
    <View style={styles.page}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {/* ===== CONTENT ===== */}
        <View style={styles.container}>
          {/* ===== TOP CARDS (FIXED HEIGHT) ===== */}
          <View style={styles.cardsContainer}>
            <TouchableOpacity
              onPress={() => openChatScreen("design")}
              style={styles.cardTeal}
              activeOpacity={0.85}
            >
              <View style={styles.cardContent}>
                <Image
                  source={require("../../assets/design.png")}
                  style={styles.cardIcon}
                />
                <Text style={styles.cardText}>Design with AI</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openChatScreen("customize")}
              style={styles.cardPink}
              activeOpacity={0.85}
            >
              <View style={styles.cardContent}>
                <Image
                  source={require("../../assets/customize.png")}
                  style={styles.cardIcon}
                />
                <Text style={styles.cardText}>Customize with AI</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ===== HISTORY TITLE (FIXED SPACE) ===== */}
          <View style={styles.historyTitleWrap}>
            <Text style={styles.historyTitle}>Recent Conversations</Text>
          </View>

          {/* ===== HISTORY LIST (NO LAYOUT SHIFT) ===== */}
          <ScrollView
            style={styles.historyContainer}
            contentContainerStyle={styles.historyContent}
            showsVerticalScrollIndicator={false}
          >
            {historyList.map((chat) => (
              <TouchableOpacity
                key={`${chat.tab}-${chat.id}`}
                style={styles.historyItem}
                activeOpacity={0.7}
                onPress={() => openChatHistory(chat.tab, chat.id)}
              >
                <View style={styles.historyHeader}>
                  <View style={styles.historyAccent} />
                  <Text style={styles.historyItemTitle}>
                    {chat.title}
                  </Text>
                </View>

                <Text
                  style={styles.historyItemSnippet}
                  numberOfLines={2}
                >
                  {chat.lastMessage}
                </Text>

                <Text style={styles.historyItemDate}>
                  {chat.date}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* ===== BOTTOM NAV (FIXED POSITION) ===== */}
      <BottomNavbar subType={subType} />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F3F9FA",
  },

  keyboardWrap: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  /* ===== TOP CARDS ===== */
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    minHeight: 120, // ✅ prevents jump
  },

  cardTeal: {
    flex: 1,
    height: 120,
    borderRadius: 20,
    backgroundColor: "#e0f7fa",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    marginHorizontal: 4,
  },

  cardPink: {
    flex: 1,
    height: 120,
    borderRadius: 20,
    backgroundColor: "#fce4ec",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    marginHorizontal: 4,
  },

  cardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  cardIcon: {
    width: 48,
    height: 48,
    resizeMode: "contain",
    marginBottom: 10,
  },

  cardText: {
    fontWeight: "600",
    color: "#0F3E48",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 0.5,
  },

  /* ===== HISTORY ===== */
  historyTitleWrap: {
    minHeight: 34, // ✅ fixed space
    justifyContent: "center",
    marginBottom: 18,
  },

  historyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#912f56",
    marginLeft: 4,
  },

  historyContainer: {
    flex: 1,
  },

  historyContent: {
    paddingBottom: 120, // ✅ safe scroll space (navbar)
  },

  historyItem: {
    backgroundColor: "#faf9f6",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minHeight: 88, // ✅ prevents height change
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  historyAccent: {
    width: 6,
    height: 20,
    backgroundColor: "#912f56",
    borderRadius: 3,
    marginRight: 8,
  },

  historyItemTitle: {
    fontWeight: "700",
    color: "#0F3E48",
    fontSize: 16,
    flexShrink: 1,
  },

  historyItemSnippet: {
    color: "#4A6B70",
    fontSize: 13,
    marginTop: 2,
  },

  historyItemDate: {
    color: "#888",
    fontSize: 12,
    marginTop: 6,
    textAlign: "right",
  },
});
