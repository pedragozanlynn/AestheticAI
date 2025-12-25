import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { listenToMessages } from "../../services/chatService";
import { pickFile } from "../../services/fileUploadService";
import { handleUnsendMessage } from "../../services/handleUnsendMessage";
import { useSendMessage } from "../../services/useSendMessage";

/* ================= ACTIVE STATUS FORMAT ================= */
const formatLastSeen = (timestamp) => {
  if (!timestamp?.toDate) return "Active recently";

  const last = timestamp.toDate();
  const now = new Date();
  const diffMs = now - last;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Active just now";
  if (diffMin < 60) return `Active ${diffMin} minutes ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)
    return `Active ${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `Active ${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
};

export default function ChatRoom() {
  const { roomId, userId: routeUserId } = useLocalSearchParams();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [consultant, setConsultant] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState(null);

  const flatListRef = useRef(null);
  const unsubRef = useRef(null);

  /* ================= LOAD CONSULTANT PROFILE ================= */
  useEffect(() => {
    const loadProfile = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const profileKey = keys.find((k) =>
        k.startsWith("aestheticai:user-profile:")
      );
      if (!profileKey) return;

      const raw = await AsyncStorage.getItem(profileKey);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!parsed?.uid) return;

      setConsultant({ id: parsed.uid, ...parsed });
    };

    loadProfile();
  }, []);

  /* ================= LOAD CLIENT ================= */
  useEffect(() => {
    if (!routeUserId) return;

    const ref = doc(db, "users", routeUserId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setChatUser(snap.data());
    });

    return () => unsub();
  }, [routeUserId]);

  /* ================= MARK AS READ ================= */
  useEffect(() => {
    if (!roomId || !consultant?.id) return;

    updateDoc(doc(db, "chatRooms", roomId), {
      unreadForConsultant: false,
    }).catch(() => {});
  }, [roomId, consultant]);

  /* ================= LISTEN TO MESSAGES ================= */
  useEffect(() => {
    if (!roomId || !consultant?.id) return;

    setLoading(true);
    try {
      unsubRef.current = listenToMessages(roomId, (msgs) => {
        setMessages(msgs);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);
      });
    } finally {
      setLoading(false);
    }

    return () => unsubRef.current?.();
  }, [roomId, consultant]);

  /* ================= SEND MESSAGE ================= */
  const { sendTextMessage, sendFileMessage } = useSendMessage({
    roomId,
    senderId: consultant?.id,
    senderType: "consultant",
    setMessages,
  });

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendTextMessage(text.trim());
    setText("");
  };

  const handleFileSend = async () => {
    const file = await pickFile();
    if (!file) return;
    await sendFileMessage(file);
  };

  const handleUnsend = async (msg) => {
    await handleUnsendMessage(msg, roomId, consultant.id, setMessages);
  };

  /* ================= MARK AS COMPLETE ================= */
  const handleMarkComplete = async () => {
    await updateDoc(doc(db, "chatRooms", roomId), {
      status: "completed",
      completedAt: new Date(),
    });
  };

  /* ================= RENDER MESSAGE ================= */
  const renderMsg = ({ item }) => {
    const isMe = item.senderType === "consultant";
    const textColor = isMe ? "#fff" : "#000";

    const Wrapper = ({ children }) => (
      <TouchableOpacity
        style={[
          styles.message,
          isMe ? styles.myMessage : styles.theirMessage,
        ]}
        onLongPress={() => isMe && !item.unsent && handleUnsend(item)}
      >
        {children}
      </TouchableOpacity>
    );

    if (item.unsent) {
      return (
        <Wrapper>
          <Text style={{ fontStyle: "italic", color: textColor }}>
            🚫 Message unsent
          </Text>
        </Wrapper>
      );
    }

    if (item.type === "image") {
      const imageUri = item.fileUrl || item.localUri;
      return (
        <Wrapper>
          <TouchableOpacity
            onPress={() => {
              setModalImageUri(imageUri);
              setImageModalVisible(true);
            }}
          >
            <Image source={{ uri: imageUri }} style={styles.image} />
          </TouchableOpacity>
        </Wrapper>
      );
    }

    return (
      <Wrapper>
        <Text style={{ color: textColor }}>{item.text}</Text>
      </Wrapper>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* ================= HEADER ================= */}
        <View style={styles.chatHeader}>
          <View style={styles.avatar}>
            <Image
              source={
                chatUser?.gender === "Female"
                  ? require("../../assets/office-woman.png")
                  : require("../../assets/office-man.png")
              }
              style={styles.avatarImage}
            />
          </View>

          <View>
            <Text style={styles.chatName}>
              {chatUser?.name || "Client"}
            </Text>
            <Text
              style={[
                styles.chatStatus,
                { color: chatUser?.isOnline ? "#4CAF50" : "#999" },
              ]}
            >
              {chatUser?.isOnline
                ? "Active now"
                : formatLastSeen(chatUser?.lastSeen)}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMsg}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 180 }}
          />
        )}

        {/* ===== MARK AS COMPLETE BUTTON ===== */}
        <View style={styles.completeWrap}>
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={handleMarkComplete}
          >
            <Text style={styles.completeText}>Mark as Complete</Text>
          </TouchableOpacity>
        </View>

        {/* ================= INPUT ================= */}
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={handleFileSend}>
            <Text style={styles.attachText}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
          />

          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={imageModalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <Image
            source={{ uri: modalImageUri }}
            style={styles.modalImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setImageModalVisible(false)}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, paddingTop: 40 },

  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#E4E6EB",
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    backgroundColor: "#E4E6EB",
    marginRight: 10,
  },
  avatarImage: { width: "100%", height: "100%" },

  chatName: { fontSize: 16, fontWeight: "700" },
  chatStatus: { fontSize: 12 },

  message: {
    padding: 10,
    marginVertical: 6,
    maxWidth: "75%",
    borderRadius: 16,
  },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#0084FF" },
  theirMessage: { alignSelf: "flex-start", backgroundColor: "#E4E6EB" },

  completeWrap: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "flex-start", // ✅ FIX
    paddingLeft: 15,          // optional para may konting margin sa kaliwa
  },
  completeBtn: {
    borderWidth: 1,
    borderColor: "#008000",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  completeText: {
    color: "#008000",
    fontWeight: "700",
  },
  
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#F0F2F5",
  },
  attachText: { fontSize: 22, marginRight: 10 },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: "#0084FF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  sendText: { color: "#fff", fontWeight: "700" },

  image: { width: 150, height: 150, borderRadius: 10 },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: { width: "90%", height: "80%" },

  closeBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 20,
  },
  closeText: { color: "#fff", fontWeight: "700" },
});
