// app/(Consultant)/ChatRoom.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  View
} from "react-native";

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  ensureChatRoom,
  listenToMessages,
  markConsultantChatAsRead,
} from "../../services/chatService";
import { pickFile } from "../../services/fileUploadService";
import { handleUnsendMessage } from "../../services/handleUnsendMessage";
import { useSendMessage } from "../../services/useSendMessage";

export default function ChatRoom() {
  const { roomId, userId: routeUserId, appointmentId: routeAppointmentId } =
    useLocalSearchParams();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomExists, setRoomExists] = useState(false);

  // --- Image Modal State ---
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState(null);

  const flatListRef = useRef();
  const unsubRef = useRef(null);

  // Load consultant profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const profileKey = keys.find((k) =>
          k.startsWith("aestheticai:user-profile:")
        );
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

  // Initialize chat room
  useEffect(() => {
    if (!roomId || !consultant?.id) return;

    const init = async () => {
      setLoading(true);

      try {
        if (!routeUserId) {
          console.warn("ChatRoom missing userId — cannot create room.");
          setLoading(false);
          return;
        }

        await ensureChatRoom(
          roomId,
          routeUserId,
          consultant.id,
          routeAppointmentId && routeAppointmentId !== "null"
            ? routeAppointmentId
            : null
        );

        unsubRef.current = listenToMessages(roomId, (msgs) => {
          setMessages(msgs);
          setTimeout(
            () => flatListRef.current?.scrollToEnd({ animated: true }),
            50
          );
        });

        markConsultantChatAsRead(roomId).catch((e) =>
          console.warn("markConsultantChatAsRead error:", e)
        );

        setRoomExists(true);
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

  // --- Integrate useSendMessage hook ---
  const { sendTextMessage, sendFileMessage } = useSendMessage({
    roomId,
    senderId: consultant?.id,
    senderType: "consultant",
    setMessages,
  });

 // MARK AS COMPLETE
const handleMarkComplete = async () => {
  if (!roomId || !consultant?.id) return;

  try {
    const roomRef = doc(db, "chatRooms", roomId);
    await updateDoc(roomRef, {
      status: "completed",
      completedAt: new Date(),
    });

    console.log("✅ Chat marked as complete by consultant:", roomId); // <-- LOG HERE
    Alert.alert("Success", "This chat has been marked as complete.");
  } catch (err) {
    console.error("Error marking complete:", err);
    Alert.alert("Error", "Failed to mark chat as complete.");
  }
};

  // HANDLERS
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

  // RENDER MESSAGE
  const renderMsg = ({ item }) => {
    const isMe = item.senderType === "consultant";

    const Wrapper = ({ children }) => (
      <TouchableOpacity
        style={[styles.message, isMe ? styles.myMessage : styles.theirMessage]}
        onLongPress={() => isMe && !item.unsent && handleUnsend(item)}
      >
        {children}
      </TouchableOpacity>
    );

    if (item.unsent) {
      return (
        <Wrapper>
          <Text style={[styles.messageText, styles.unsent, { color: "#999" }]}>
            🚫 Message unsent
          </Text>
        </Wrapper>
      );
    }

    if (item.type === "image" && (item.fileUrl || item.localUri)) {
      const imageUri = item.fileUrl || item.localUri;
      return (
        <Wrapper>
          <TouchableOpacity
            onPress={() => {
              setModalImageUri(imageUri);
              setImageModalVisible(true);
            }}
          >
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <Text style={{ marginTop: 5, color: isMe ? "#fff" : "#000", fontSize: 12 }}>
            {item.fileName}
          </Text>
          {isMe && item.failed && <Text style={styles.failed}>failed</Text>}
          {isMe && item.sending && <Text style={styles.pending}>uploading...</Text>}
        </Wrapper>
      );
    }

    if (item.type === "file") {
      return (
        <Wrapper>
          <Text style={[styles.messageText, { color: isMe ? "#fff" : "#000" }]}>
            📄 {item.fileName}
          </Text>
          {isMe && item.failed && <Text style={styles.failed}>failed</Text>}
          {isMe && item.sending && <Text style={styles.pending}>uploading...</Text>}
        </Wrapper>
      );
    }

    return (
      <Wrapper>
        <Text style={[styles.messageText, { color: isMe ? "#fff" : "#000" }]}>{item.text}</Text>
        {isMe && item.failed && <Text style={styles.failed}>failed</Text>}
        {isMe && item.sending && <Text style={styles.pending}>sending...</Text>}
      </Wrapper>
    );
  };

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
            contentContainerStyle={{ paddingBottom: 160 }}
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

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSend}
            disabled={!roomExists}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Send</Text>
          </TouchableOpacity>
        </View>

        {roomExists && (
          <TouchableOpacity
            style={styles.completeOutlineBtn}
            onPress={handleMarkComplete}
          >
            <Text style={styles.completeOutlineText}>Mark as Complete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* --- Image Modal --- */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          {modalImageUri ? (
            <Image source={{ uri: modalImageUri }} style={styles.modalImage} resizeMode="contain" />
          ) : (
            <ActivityIndicator size="large" color="#fff" />
          )}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 40,
              right: 20,
              padding: 10,
              backgroundColor: "rgba(255,255,255,0.3)",
              borderRadius: 20,
            }}
            onPress={() => setImageModalVisible(false)}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, paddingTop: 40 },
  header: { fontSize: 22, fontWeight: "900", color: "#0F3E48", marginBottom: 15 },
  message: { padding: 10, marginVertical: 6, maxWidth: "75%", borderRadius: 10 },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#0F3E48" },
  theirMessage: { alignSelf: "flex-start", backgroundColor: "#E6E6E6" },
  messageText: { color: "#fff" },
  pending: { color: "#ccc", fontSize: 10, marginTop: 3 },
  failed: { color: "red", fontSize: 10, marginTop: 3 },
  unsent: { color: "#999", fontSize: 10, marginTop: 3, fontStyle: "italic" },
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
  input: { flex: 1, padding: 10, backgroundColor: "#F5F5F5", borderRadius: 10 },
  sendBtn: { marginLeft: 10, backgroundColor: "#0F3E48", paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
  completeOutlineBtn: {
    borderWidth: 1.5,
    borderColor: "#2ecc71",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 58,
  },
  completeOutlineText: { color: "#2ecc71", fontSize: 14, fontWeight: "700" },
  // --- Image modal styles ---
  image: { width: 150, height: 150, borderRadius: 10 },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  modalImage: { width: "90%", height: "80%" },
});
