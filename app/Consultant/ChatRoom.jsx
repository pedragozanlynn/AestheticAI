// app/(Consultant)/ChatRoom.jsx
// FINAL WORKING VERSION WITH FILE PREVIEW + SUPABASE UPLOAD + FIREBASE SAVE

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

import {
  ensureChatRoom,
  listenToMessages,
  markConsultantChatAsRead,
} from "../../services/chatService";
import { sendFileMessage, sendMessage } from "../../services/messageService";

import { pickFile, uploadToSupabase } from "../../services/fileUploadService";

export default function ChatRoom() {
  const { roomId, userId: routeUserId, appointmentId: routeAppointmentId } =
    useLocalSearchParams();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomExists, setRoomExists] = useState(false);

  const flatListRef = useRef();
  const unsubRef = useRef(null);

  // LOAD CONSULTANT PROFILE
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const profileKey = keys.find((k) => k.startsWith("aestheticai:user-profile:"));
        if (!profileKey) return;

        const raw = await AsyncStorage.getItem(profileKey);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        if (!parsed.uid) return;

        setConsultant({ id: parsed.uid, ...parsed });
      } catch (e) {
        console.log("Error loading consultant profile:", e);
      }
    };
    loadProfile();
  }, []);

  // INIT CHATROOM
  useEffect(() => {
    if (!roomId || !consultant?.id) return;

    const init = async () => {
      setLoading(true);

      try {
        const roomRef = doc(db, "chatRooms", roomId);
        const snap = await getDoc(roomRef);

        const appointmentIdToUse =
          routeAppointmentId && routeAppointmentId !== "null"
            ? routeAppointmentId
            : null;

        if (!snap.exists()) {
          if (!routeUserId) {
            console.warn("ChatRoom missing userId — cannot create room.");
            setLoading(false);
            return;
          }

          await ensureChatRoom(roomId, routeUserId, consultant.id, appointmentIdToUse);
          await new Promise((r) => setTimeout(r, 200));

          const checkSnap = await getDoc(roomRef);
          if (!checkSnap.exists()) {
            console.error("Failed to create chat room.");
            setLoading(false);
            return;
          }

          setRoomExists(true);
        } else {
          setRoomExists(true);

          await ensureChatRoom(
            roomId,
            routeUserId,
            consultant.id,
            appointmentIdToUse
          );
        }

        const finalSnap = await getDoc(roomRef);
        const data = finalSnap.data();

        if (!data.userId || !data.consultantId) {
          console.warn("Invalid chatRoom fields:", data);
          setLoading(false);
          return;
        }

        if (data.consultantId !== consultant.id) {
          console.warn("Consultant mismatch:", consultant.id, data.consultantId);
          setLoading(false);
          return;
        }

        if (unsubRef.current) {
          try {
            unsubRef.current();
          } catch {}
          unsubRef.current = null;
        }

        unsubRef.current = listenToMessages(roomId, (msgs) => {
          setMessages(msgs);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
        });

        markConsultantChatAsRead(roomId).catch((e) =>
          console.warn("markConsultantChatAsRead error:", e)
        );

        setLoading(false);
      } catch (err) {
        console.error("ChatRoom init error:", err);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (unsubRef.current) {
        try {
          unsubRef.current();
        } catch {}
        unsubRef.current = null;
      }
    };
  }, [roomId, consultant, routeUserId, routeAppointmentId]);

  // SEND TEXT
  const handleSend = async () => {
    if (!text.trim() || !consultant?.id || !roomExists) return;

    const messageText = text.trim();
    setText("");

    const tempId = "temp-" + Date.now();

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: messageText,
        senderId: consultant.id,
        senderType: "consultant",
        sending: true,
      },
    ]);

    flatListRef.current?.scrollToEnd({ animated: true });

    try {
      const realId = await sendMessage(roomId, consultant.id, "consultant", messageText);

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, id: realId, sending: false } : msg))
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, sending: false, failed: true } : msg))
      );
    }
  };

  // SEND FILE
  const handleFileSend = async () => {
    if (!consultant?.id || !roomExists) return;

    const file = await pickFile();
    if (!file) return;

    const tempId = "temp-file-" + Date.now();

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        fileName: file.name,
        fileType: file.mimeType,
        senderId: consultant.id,
        senderType: "consultant",
        type: "file",
        sending: true,
      },
    ]);

    flatListRef.current?.scrollToEnd({ animated: true });

    try {
      const uploaded = await uploadToSupabase(file);
      if (!uploaded?.fileUrl) throw new Error("Upload failed: no URL returned");

      const realId = await sendFileMessage(
        roomId,
        consultant.id,
        "consultant",
        uploaded.fileUrl,
        uploaded.fileName,
        uploaded.fileType
      );

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: realId, sending: false } : m))
      );
    } catch (err) {
      console.log("❌ file send failed", err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, sending: false, failed: true } : m))
      );
    }
  };

  // RENDER MESSAGE
  const renderMsg = ({ item }) => {
    const isMe = item.senderType === "consultant";

    if (item.type === "file") {
      return (
        <TouchableOpacity
          style={[styles.message, isMe ? styles.myMessage : styles.theirMessage]}
          onPress={() => item.fileUrl && Linking.openURL(item.fileUrl)}
        >
          <Text style={[styles.messageText, !isMe && { color: "#000" }]}>
            📎 {item.fileName}
          </Text>

          {isMe && item.sending && <Text style={styles.pending}>uploading...</Text>}
          {isMe && item.failed && <Text style={styles.failed}>failed</Text>}
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.message, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, !isMe && { color: "#000" }]}>{item.text}</Text>

        {isMe && item.sending && <Text style={styles.pending}>sending...</Text>}
        {isMe && item.failed && <Text style={styles.failed}>failed</Text>}
      </View>
    );
  };

  // UI
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Text style={styles.header}>Consultant Chat Room</Text>

        {loading ? (
          <ActivityIndicator size="small" color="#0F3E48" />
        ) : !roomExists ? (
          <Text style={{ padding: 20, color: "#333" }}>
            Chat room not available. Make sure the appointment is accepted.
          </Text>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMsg}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleFileSend}>
            <Text style={styles.attachText}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
          />

          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!roomExists}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

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
  myMessage: { alignSelf: "flex-end", backgroundColor: "#0F3E48" },
  theirMessage: { alignSelf: "flex-start", backgroundColor: "#E6E6E6" },
  messageText: { color: "#fff" },

  pending: { color: "#ccc", fontSize: 10, marginTop: 3 },
  failed: { color: "red", fontSize: 10, marginTop: 3 },

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

  attachBtn: { justifyContent: "center", marginRight: 10 },
  attachText: { fontSize: 22 },

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
});