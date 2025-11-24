// User/ChatRoom.jsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  listenToMessages,
  markUserChatAsRead,
} from "../../services/chatService";
import { pickFile, uploadToSupabase } from "../../services/fileUploadService";
import { sendFileMessage, sendMessage } from "../../services/messageService";

export default function ChatRoom() {
  const { roomId } = useLocalSearchParams();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef(null);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const profileKey = keys.find(
        (k) =>
          k.startsWith("aestheticai:client-profile:") ||
          k.startsWith("aestheticai:user-profile:")
      );
      if (!profileKey) {
        console.log("❌ No user profile key found");
        return;
      }
      const raw = await AsyncStorage.getItem(profileKey);
      if (!raw) {
        console.log("❌ No raw profile data");
        return;
      }
      const parsed = JSON.parse(raw);
      console.log("✅ USER LOADED:", parsed);
      setUser(parsed);
    };
    loadProfile();
  }, []);

  // Realtime messages listener
  useEffect(() => {
    if (!roomId || !user) return;
    const unsubscribe = listenToMessages(roomId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    });
    markUserChatAsRead(roomId).catch(() => {});
    return () => unsubscribe();
  }, [roomId, user]);

  // Send message (text)
  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const messageText = text;
    setText("");
    const tempId = "temp-" + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: messageText,
        senderId: user.uid,
        senderType: "user",
        type: "text",
        sending: true,
      },
    ]);
    flatListRef.current?.scrollToEnd({ animated: true });
    try {
      const realId = await sendMessage(roomId, user.uid, "user", messageText);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, id: realId, sending: false } : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, sending: false, failed: true } : m
        )
      );
      console.log("❌ sendMessage failed", err);
    }
  };

  // Send file message
  const handleFileSend = async () => {
    if (!user) return;
    const file = await pickFile();
    if (!file) return;
    const tempId = "temp-file-" + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        fileName: file.name,
        fileType: file.mimeType,
        senderId: user.uid,
        senderType: "user",
        type: "file",
        sending: true,
      },
    ]);
    flatListRef.current?.scrollToEnd({ animated: true });
    try {
      const uploaded = await uploadToSupabase(file);
      if (!uploaded) throw new Error("Upload failed");
      const realId = await sendFileMessage(
        roomId,
        user.uid,
        "user",
        uploaded.fileUrl,
        uploaded.fileName,
        uploaded.fileType
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, id: realId, sending: false }
            : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, sending: false, failed: true } : m
        )
      );
      console.log("❌ file send failed", err);
    }
  };

  // Render message bubble
  const renderMessage = ({ item }) => {
    const mine = item.senderType === "user";
    if (item.type === "file") {
      // file message UI
      return (
        <TouchableOpacity
          style={[styles.message, mine ? styles.myMessage : styles.theirMessage]}
          onPress={() => Linking.openURL(item.fileUrl)}
        >
          <Text style={[styles.messageText, !mine && { color: "#000" }]}>
            📄 {item.fileName}
          </Text>
          {mine && item.sending && <Text style={styles.statusText}>uploading...</Text>}
          {mine && item.failed && <Text style={styles.failedText}>failed</Text>}
        </TouchableOpacity>
      );
    }

    // text message UI
    return (
      <View style={[styles.message, mine ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, !mine && { color: "#000" }]}>
          {item.text}
        </Text>
        {mine && item.sending && <Text style={styles.statusText}>sending...</Text>}
        {mine && item.failed && <Text style={styles.failedText}>failed</Text>}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Text style={styles.header}>Chat Room</Text>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        {typing && <Text style={styles.typingText}>Consultant is typing...</Text>}

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleFileSend}>
            <Text style={styles.attachText}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={text}
            placeholder="Type a message..."
            onChangeText={(v) => {
              setText(v);
              setTyping(true);
              setTimeout(() => setTyping(false), 900);
            }}
          />

          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, paddingTop: 40 },
  header: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F3E48",
    marginBottom: 15,
  },

  message: {
    padding: 10,
    marginVertical: 6,
    maxWidth: "75%",
    borderRadius: 10,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#0F3E48",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E6E6E6",
  },
  messageText: {
    color: "#fff",
  },
  statusText: {
    color: "#ccc",
    fontSize: 10,
    marginTop: 3,
  },
  failedText: {
    color: "#c33",
    fontSize: 10,
    marginTop: 3,
  },

  typingText: {
    marginLeft: 10,
    marginBottom: 4,
    color: "#4a4a4a",
  },

  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  attachBtn: {
    justifyContent: "center",
    marginRight: 10,
  },
  attachText: {
    fontSize: 22,
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: "#0F3E48",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  sendBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
