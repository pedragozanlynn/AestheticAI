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

/* ================= AUTO COMPLETE UTILS ================= */
const TWELVE_HOURS = 12 * 60 * 60 * 1000;
const isAfter12Hours = (timestamp) => {
  if (!timestamp?.toDate) return false;
  return Date.now() - timestamp.toDate().getTime() > TWELVE_HOURS;
};

/* ================= ACTIVE STATUS FORMAT ================= */
const formatLastSeen = (timestamp) => {
  if (!timestamp?.toDate) return "Active recently";
  const last = timestamp.toDate();
  const now = new Date();
  const diffMin = Math.floor((now - last) / 60000);
  if (diffMin < 1) return "Active just now";
  if (diffMin < 60) return `Active ${diffMin} minutes ago`;
  const diffHr = Math.floor(diffMin / 60);
  return diffHr < 24
    ? `Active ${diffHr} hour${diffHr > 1 ? "s" : ""} ago`
    : `Active ${Math.floor(diffHr / 24)} days ago`;
};

export default function ChatRoom() {
  const { roomId, userId: routeUserId } = useLocalSearchParams();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [consultant, setConsultant] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [roomStatus, setRoomStatus] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const flatListRef = useRef(null);
  const unsubRef = useRef(null);

  /* ================= LOAD CONSULTANT ================= */
  useEffect(() => {
    const loadProfile = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const profileKey = keys.find((k) =>
        k.startsWith("aestheticai:user-profile:")
      );
      if (!profileKey) return;
      const parsed = JSON.parse(await AsyncStorage.getItem(profileKey));
      if (parsed?.uid) setConsultant({ id: parsed.uid, ...parsed });
    };
    loadProfile();
  }, []);

  /* ================= LOAD CLIENT ================= */
  useEffect(() => {
    if (!routeUserId) return;
    return onSnapshot(doc(db, "users", routeUserId), (snap) => {
      if (snap.exists()) setChatUser(snap.data());
    });
  }, [routeUserId]);

  /* ================= CHAT ROOM LISTENER + AUTO COMPLETE ================= */
  useEffect(() => {
    if (!roomId) return;

    const unsub = onSnapshot(doc(db, "chatRooms", roomId), async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      setRoomStatus(data.status);

      // ⏱ AUTO COMPLETE AFTER 12 HOURS
      if (data.status !== "completed" && isAfter12Hours(data.createdAt)) {
        await updateDoc(doc(db, "chatRooms", roomId), {
          status: "completed",
          completedAt: new Date(),
        });
      }
    });

    return unsub;
  }, [roomId]);

  /* ================= MESSAGES ================= */
  useEffect(() => {
    if (!roomId || !consultant?.id) return;
    setLoading(true);

    unsubRef.current = listenToMessages(roomId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    });

    setLoading(false);
    return () => unsubRef.current?.();
  }, [roomId, consultant]);

  /* ================= SEND MESSAGE ================= */
  const { sendTextMessage, sendFileMessage } = useSendMessage({
    roomId,
    senderId: consultant?.id,
    senderType: "consultant",
    setMessages,
  });

  const isCompleted = roomStatus === "completed";

  const handleSend = async () => {
    if (!text.trim() || isCompleted) return;
    await sendTextMessage(text.trim());
    setText("");
  };

  const handleFileSend = async () => {
    if (isCompleted) return;
    const file = await pickFile();
    if (file) await sendFileMessage(file);
  };

  /* ================= CONFIRM COMPLETE ================= */
  const confirmComplete = async () => {
    await updateDoc(doc(db, "chatRooms", roomId), {
      status: "completed",
      completedAt: new Date(),
    });
    setConfirmVisible(false);
  };

  /* ================= RENDER MESSAGE ================= */
  const renderMsg = ({ item }) => {
    const isMe = item.senderType === "consultant";
    return (
      <TouchableOpacity
        style={[
          styles.message,
          isMe ? styles.myMessage : styles.theirMessage,
        ]}
        onLongPress={() =>
          isMe && !item.unsent && handleUnsendMessage(item, roomId)
        }
      >
        <Text style={{ color: isMe ? "#fff" : "#000" }}>
          {item.unsent ? "🚫 Message unsent" : item.text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* HEADER */}
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
            <Text style={styles.chatName}>{chatUser?.name || "Client"}</Text>
            <Text style={styles.chatStatus}>
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
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingBottom: 180 }}
          />
        )}

        {/* MARK AS COMPLETE */}
        {!isCompleted && (
          <View style={styles.completeWrap}>
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => setConfirmVisible(true)}
            >
              <Text style={styles.completeText}>Mark as Complete</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* INPUT */}
        <View style={[styles.inputContainer, isCompleted && { opacity: 0.5 }]}>
          <TouchableOpacity onPress={handleFileSend} disabled={isCompleted}>
            <Text style={styles.attachText}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            editable={!isCompleted}
            placeholder={
              isCompleted ? "Chat is completed" : "Type a message..."
            }
          />

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSend}
            disabled={isCompleted}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONFIRM MODAL */}
      <Modal transparent visible={confirmVisible} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Mark consultation as complete?
            </Text>
            <Text style={styles.modalDesc}>
              You will no longer be able to chat after this.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setConfirmVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={confirmComplete}
              >
                <Text style={{ color: "#fff" }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  chatStatus: { fontSize: 12, color: "#777" },

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
    left: 15,
  },
  completeBtn: {
    borderWidth: 1,
    borderColor: "#008000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  completeText: { color: "#008000", fontWeight: "700" },

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

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    width: "80%",
    borderRadius: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalDesc: { marginTop: 6, color: "#555" },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 10,
  },
  modalCancel: { padding: 8 },
  modalConfirm: {
    backgroundColor: "#008000",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
});
