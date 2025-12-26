import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
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

import { db } from "../../config/firebase";
import { listenToMessages, markUserChatAsRead } from "../../services/chatService";
import { pickFile } from "../../services/fileUploadService";
import { handleUnsendMessage } from "../../services/handleUnsendMessage";
import { useSendMessage } from "../../services/useSendMessage";
import RatingModal from "../components/RatingModal";

/* ================= ACTIVE STATUS FORMAT ================= */
const formatActiveStatus = (isOnline, lastSeen) => {
  if (isOnline) return "Active now";
  if (!lastSeen?.toDate) return "Offline";

  const mins = Math.floor((Date.now() - lastSeen.toDate()) / 60000);
  if (mins < 1) return "Active 1 minute ago";
  if (mins < 60) return `Active ${mins} minutes ago`;

  const hrs = Math.floor(mins / 60);
  return `Active ${hrs} hour${hrs > 1 ? "s" : ""} ago`;
};

export default function ChatRoom() {
  const { roomId, userId, consultantId } = useLocalSearchParams();

  const [user, setUser] = useState(null);
  const [consultant, setConsultant] = useState(null); // ✅ already exists
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState(null);
  const [isChatLocked, setIsChatLocked] = useState(false);

  const flatListRef = useRef(null);

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const loadUser = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const key = keys.find((k) =>
        k.startsWith("aestheticai:user-profile:")
      );
      if (!key) return;

      const raw = await AsyncStorage.getItem(key);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setUser({ ...parsed, uid: parsed.uid });
    };
    loadUser();
  }, []);

  /* ================= LOAD CONSULTANT ================= */
  useEffect(() => {
    if (!consultantId) return;

    const unsub = onSnapshot(doc(db, "consultants", consultantId), (snap) => {
      if (snap.exists()) setConsultant(snap.data());
    });

    return () => unsub();
  }, [consultantId]);

  /* ================= ENSURE CHAT ROOM ================= */
  useEffect(() => {
    if (!roomId || !userId || !consultantId) return;

    const ref = doc(db, "chatRooms", roomId);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setDoc(ref, {
          userId,
          consultantId,
          createdAt: serverTimestamp(),
          status: "active",
          ratingSubmitted: false,
        });
      } else {
        const data = snap.data();
        const createdAt = data.createdAt?.toDate?.();
        const twelveHoursPassed =
          createdAt &&
          Date.now() - createdAt.getTime() >= 12 * 60 * 60 * 1000;

        if (
          (data.status === "completed" || twelveHoursPassed) &&
          !data.ratingSubmitted
        ) {
          setRatingModalVisible(true);
        }

        setIsChatLocked(
          data.ratingSubmitted ||
            data.status === "completed" ||
            twelveHoursPassed
        );
      }
    });

    return () => unsub();
  }, [roomId, userId, consultantId]);

  /* ================= MESSAGES ================= */
  useEffect(() => {
    if (!roomId || !user) return;

    const unsub = listenToMessages(roomId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 60);
    });

    markUserChatAsRead(roomId).catch(() => {});
    return () => unsub();
  }, [roomId, user]);

  const { sendTextMessage, sendFileMessage } = useSendMessage({
    roomId,
    senderId: user?.uid,
    senderType: "user",
    setMessages,
  });

  /* ================= RENDER MESSAGE ================= */
  const renderMessage = ({ item }) => {
    const mine = item.senderType === "user";

    return (
      <TouchableOpacity
        style={[
          styles.message,
          mine ? styles.myMessage : styles.theirMessage,
        ]}
        onLongPress={() =>
          handleUnsendMessage(item, roomId, user?.uid, setMessages)
        }
      >
        {item.type === "image" ? (
          <TouchableOpacity
            onPress={() => {
              setModalImageUri(item.fileUrl);
              setImageModalVisible(true);
            }}
          >
            <Image source={{ uri: item.fileUrl }} style={styles.image} />
          </TouchableOpacity>
        ) : (
          <Text style={{ color: mine ? "#fff" : "#000" }}>
            {item.unsent ? "🚫 Message unsent" : item.text}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* ================= HEADER (FIXED) ================= */}
        <View style={styles.chatHeader}>
          <View style={styles.avatar}>
            <Image
              source={
                consultant?.gender === "Female"
                  ? require("../../assets/office-woman.png")
                  : require("../../assets/office-man.png")
              }
              style={styles.avatarImage}
            />
          </View>

          <View>
            <Text style={styles.chatName}>
              {consultant?.fullName || "Consultant"}
            </Text>
            <Text style={styles.chatStatus}>
              {formatActiveStatus(
                consultant?.isOnline,
                consultant?.lastSeen
              )}
            </Text>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 140 }}
        />

        {isChatLocked && (
          <Text style={styles.lockNotice}>
            This consultation has ended. Messaging is disabled.
          </Text>
        )}

        {/* INPUT */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            disabled={isChatLocked}
            onPress={async () => {
              const file = await pickFile();
              if (file) await sendFileMessage(file);
            }}
          >
            <Text style={styles.attachText}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={text}
            editable={!isChatLocked}
            placeholder={
              isChatLocked ? "Consultation has ended" : "Type a message..."
            }
            onChangeText={setText}
          />

          <TouchableOpacity
            style={styles.sendBtn}
            disabled={isChatLocked}
            onPress={async () => {
              if (!text.trim()) return;
              await sendTextMessage(text);
              setText("");
            }}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* IMAGE MODAL */}
      <Modal visible={imageModalVisible} transparent>
        <View style={styles.modalBackground}>
          <Image source={{ uri: modalImageUri }} style={styles.modalImage} />
        </View>
      </Modal>

      {/* RATING MODAL – unchanged */}
      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, paddingTop: 40 },

  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#E4E6EB",
    paddingBottom: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    marginRight: 10,
  },
  avatarImage: { width: "100%", height: "100%" },

  chatName: { fontSize: 16, fontWeight: "700" },
  chatStatus: { fontSize: 12, color: "#4CAF50" },

  lockNotice: {
    textAlign: "center",
    color: "#888",
    marginBottom: 6,
    fontStyle: "italic",
  },

  message: {
    padding: 10,
    marginVertical: 6,
    maxWidth: "75%",
    borderRadius: 16,
  },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#0084FF" },
  theirMessage: { alignSelf: "flex-start", backgroundColor: "#E4E6EB" },

  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#F0F2F5",
  },
  attachText: { fontSize: 22, marginRight: 10 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  sendBtn: {
    backgroundColor: "#0084FF",
    paddingHorizontal: 15,
    borderRadius: 20,
    marginLeft: 10,
  },
  sendBtnText: { color: "#fff", fontWeight: "700" },

  image: { width: 150, height: 150, borderRadius: 10 },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: { width: "90%", height: "80%" },
});
