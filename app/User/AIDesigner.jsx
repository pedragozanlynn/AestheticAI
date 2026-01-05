
// app/user/AIDesigner.jsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import useSubscriptionType from "../../services/useSubscriptionType";
import BottomNavbar from "../components/BottomNav";

// ✅ API URL (Using your IP)
const API_URL = "http://192.168.1.8:3000/api/redesign-room";

export default function AIDesigner() {
  const router = useRouter();
  const subType = useSubscriptionType();


  // View State: 'dashboard' or 'design'
  const [view, setView] = useState("dashboard");

  // AI State
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      type: "text",
      content: "Hello! I'm your AI Interior Designer. 🎨\n\nUpload a photo of your room and tell me what style you'd like (e.g., 'Modern', 'Industrial', 'Cozy').",
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const flatListRef = React.useRef(null);

  // Mock chat summaries for history
  const [chatSummaries] = useState({
    design: [
      { id: "1", title: "Living Room Design", lastMessage: "Great! I suggest neutral colors...", date: "Nov 17" },
      { id: "2", title: "Workspace Redesign", lastMessage: "Consider adding a small desk...", date: "Nov 15" },
    ],
    customize: [
      { id: "1", title: "Bedroom Layout", lastMessage: "Try moving the bed to the corner...", date: "Nov 16" },
    ],
  });

  // ✅ AI FUNCTIONS
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!res.canceled) {
      const uri = res.assets[0].uri;
      setSelectedImage(uri);
      
      // Add image message to chat
      const newMsg = { id: Date.now().toString(), sender: "user", type: "image", content: uri };
      setMessages((prev) => [...prev, newMsg]);

      // AI Prompt
      setTimeout(() => {
        setMessages((prev) => [...prev, { id: Date.now().toString() + "ai", sender: "ai", type: "text", content: "Great photo! Now describe the design style you want." }]);
      }, 600);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userPrompt = input.trim();
    setInput("");
    Keyboard.dismiss();

    // Add user text
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", type: "text", content: userPrompt }]);

    if (!selectedImage) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "ai", type: "text", content: "Please upload a room photo first using the camera icon." }]);
      }, 500);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("photo", {
        uri: selectedImage,
        name: "room.jpg",
        type: "image/jpeg",
      });
      formData.append("prompt", userPrompt);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.ok) throw new Error("Server Error");

      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const resultUri = reader.result;
        setMessages((prev) => [...prev, { id: Date.now().toString() + "res", sender: "ai", type: "image", content: resultUri }]);
        setLoading(false);
      };
    } catch (error) {
      console.log(error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "ai", type: "text", content: "Sorry, I couldn't connect to the AI server. Please check your connection." }]);
      setLoading(false);
    }
  };

  const openChatScreen = (mode) => {
    if (mode === "design") {
      setView("design");
    } else {
      router.push(`/User/AIDesignerChat?tab=${mode}&chatId=new`);
    }
  };

  const openChatHistory = (tab, chatId) => {
    router.push(`/User/AIDesignerChat?tab=${tab}&chatId=${chatId}`);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === "user";
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}>
        {!isUser && <View style={styles.aiAvatar}><Ionicons name="sparkles" size={16} color="#fff" /></View>}
        <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleAI]}>
          {item.type === "image" ? (
            <Image source={{ uri: item.content }} style={styles.msgImage} />
          ) : (
            <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextAI]}>{item.content}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.page}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {view === "dashboard" ? (
          <>
            {/* ✅ DASHBOARD VIEW */}
            <View style={styles.cardsContainer}>
              <TouchableOpacity onPress={() => openChatScreen("design")} style={styles.cardTeal}>
                <View style={styles.cardContent}>
                  <Image source={require("../../assets/design.png")} style={styles.cardIcon} />
                  <Text style={styles.cardText}>Design with AI</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => openChatScreen("customize")} style={styles.cardPink}>
                <View style={styles.cardContent}>
                  <Image source={require("../../assets/customize.png")} style={styles.cardIcon} />
                  <Text style={styles.cardText}>Customize with AI</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.historyTitle}>Recent Conversations</Text>

            <ScrollView style={styles.historyContainer} showsVerticalScrollIndicator={false}>
              {chatSummaries.design.concat(chatSummaries.customize).map((chat) => (
                <TouchableOpacity
                  key={`${chat.id}-${chat.title}`}
                  style={styles.historyItem}
                  activeOpacity={0.7}
                  onPress={() =>
                    openChatHistory(
                      chatSummaries.design.includes(chat) ? "design" : "customize",
                      chat.id
                    )
                  }
                >
                  <View style={styles.historyHeader}>
                    <View style={styles.historyAccent} />
                    <Text style={styles.historyItemTitle}>{chat.title}</Text>
                  </View>
                  <Text style={styles.historyItemSnippet}>{chat.lastMessage}</Text>
                  <Text style={styles.historyItemDate}>{chat.date}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : (
          /* ✅ AI DESIGNER VIEW */
          <View style={styles.chatContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setView("dashboard")}>
                <Ionicons name="arrow-back" size={28} color="#0F3E48" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>AI Designer</Text>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Input Area */}
            <View style={styles.inputArea}>
              <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
                <Ionicons name="camera" size={24} color="#0F3E48" />
              </TouchableOpacity>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a style (e.g. Modern)..."
                value={input}
                onChangeText={setInput}
              />
              <TouchableOpacity onPress={handleSend} style={styles.sendBtn} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={20} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <BottomNavbar subType={subType} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F3F9FA" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },

  // ✅ Top Cards side-by-side
  cardsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  cardTeal: {
    flex: 1,
    height: 120,
    borderRadius: 20,
    backgroundColor: "#fce4ec", // pastel pink
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
    backgroundColor: "#fce4ec", // pastel pink
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

  // ✅ History Section
  historyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#912f56",
    marginBottom: 18,
    marginLeft: 4,
  },
  historyContainer: { flex: 1, marginBottom: 80 },
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
  },
  historyHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  historyAccent: {
    width: 6,
    height: 20,
    backgroundColor: "#912f56",
     borderRadius: 3,
    marginRight: 8,
  },
  historyItemTitle: { fontWeight: "700", color: "#0F3E48", fontSize: 16 },
  historyItemSnippet: { color: "#4A6B70", fontSize: 13, marginTop: 2 },
  historyItemDate: { color: "#888", fontSize: 12, marginTop: 6, textAlign: "right" },

  // ✅ AI Design Styles
  chatContainer: { flex: 1, paddingBottom: 80 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 15 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#0F3E48" },
  
  chatList: { paddingBottom: 20 },
  msgRow: { flexDirection: "row", marginBottom: 15, alignItems: "flex-end" },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowAI: { justifyContent: "flex-start" },
  
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#0F3E48", alignItems: "center", justifyContent: "center", marginRight: 8 },
  
  msgBubble: { maxWidth: "75%", padding: 12, borderRadius: 18 },
  msgBubbleUser: { backgroundColor: "#0F3E48", borderBottomRightRadius: 4 },
  msgBubbleAI: { backgroundColor: "#fff", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#E1E8EA" },
  
  msgText: { fontSize: 15, lineHeight: 22 },
  msgTextUser: { color: "#fff" },
  msgTextAI: { color: "#333" },
  
  msgImage: { width: 200, height: 200, borderRadius: 12 },

  inputArea: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 10, borderRadius: 30, elevation: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, marginBottom: 10 },
  attachBtn: { padding: 10 },
  chatInput: { flex: 1, fontSize: 16, maxHeight: 100, paddingHorizontal: 10 },
  sendBtn: { backgroundColor: "#0F3E48", width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginLeft: 5 },
});
