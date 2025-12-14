// app/(User)/ChatRoom.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
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
import { db } from "../../config/firebase";
import { listenToMessages, markUserChatAsRead } from "../../services/chatService";
import { handleUnsendMessage } from "../../services/handleUnsendMessage";
import { useSendMessage } from "../../services/useSendMessage";
import RatingModal from "../components/RatingModal";

export default function ChatRoom() {
  const { roomId: _roomId, userId, consultantId } = useLocalSearchParams();
  const router = useRouter();

  const [roomId, setRoomId] = useState(_roomId || `${userId}_${consultantId}`);
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  // --- Image modal ---
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState(null);

  const flatListRef = useRef(null);

  // --- Load user profile ---
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const profileKey = keys.find(
          (k) =>
            k.startsWith("aestheticai:client-profile:") ||
            k.startsWith("aestheticai:user-profile:")
        );
        if (!profileKey) return;
        const raw = await AsyncStorage.getItem(profileKey);
        if (!raw) return;
        setUser(JSON.parse(raw));
      } catch (err) {
        console.log("❌ Failed to load user profile:", err);
      }
    };
    loadProfile();
  }, []);

  // --- Ensure chat room exists ---
  useEffect(() => {
    if (!roomId || !userId || !consultantId) return;

    const ensureChatRoom = async () => {
      const chatRoomRef = doc(db, "chatRooms", roomId);
      const snap = await getDoc(chatRoomRef);

      if (!snap.exists()) {
        await setDoc(chatRoomRef, {
          userId,
          consultantId,
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastMessageAt: serverTimestamp(),
          status: "active",
        });
      }

      // Listen for consultant marking as complete
      onSnapshot(chatRoomRef, (snapshot) => {
        const data = snapshot.data();
        if (data?.status === "completed") {
          setRatingModalVisible(true);
        }
      });
    };

    ensureChatRoom().catch(console.log);
  }, [roomId, userId, consultantId]);

  // --- Use send message hook ---
  const { sendTextMessage, sendFileMessage } = useSendMessage({
    roomId,
    senderId: user?.uid,
    senderType: "user",
    setMessages,
  });

  // --- Real-time message listener ---
  useEffect(() => {
    if (!roomId || !user || !sessionActive) return;

    const unsubscribe = listenToMessages(roomId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    });

    markUserChatAsRead(roomId).catch(() => {});
    return () => unsubscribe();
  }, [roomId, user, sessionActive]);

  // --- Render message ---
  const renderMessage = ({ item }) => {
    const mine = item.senderType === "user";
    const textColor = mine ? "#fff" : "#000";

    const Wrapper = ({ children }) => (
      <TouchableOpacity
        style={[styles.message, mine ? styles.myMessage : styles.theirMessage]}
        onLongPress={() => {
          handleUnsendMessage(item, roomId, user.uid, setMessages);
        }}
      >
        {children}
      </TouchableOpacity>
    );

    if (item.unsent) {
      return (
        <Wrapper>
          <Text style={[styles.messageText, styles.unsentText, { color: textColor }]}>
            🚫 Message unsent
          </Text>
        </Wrapper>
      );
    }

    if (item.type === "image") {
      const imageUri = item.fileUrl || item.localUri;
      return (
        <Wrapper>
          {imageUri ? (
            <TouchableOpacity
              onPress={() => {
                setModalImageUri(imageUri);
                setImageModalVisible(true);
              }}
            >
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator />
            </View>
          )}
          <Text style={{ marginTop: 5, color: textColor, fontSize: 12 }}>{item.fileName}</Text>
          {mine && item.failed && <Text style={styles.failedText}>failed</Text>}
        </Wrapper>
      );
    }

    if (item.type === "file") {
      return (
        <Wrapper>
          <Text style={[styles.messageText, { color: textColor }]}>📄 {item.fileName}</Text>
          {mine && item.sending && <Text style={styles.statusText}>uploading...</Text>}
          {mine && item.failed && <Text style={styles.failedText}>failed</Text>}
        </Wrapper>
      );
    }

    return (
      <Wrapper>
        <Text style={[styles.messageText, { color: textColor }]}>{item.text}</Text>
        {mine && item.sending && <Text style={styles.statusText}>sending...</Text>}
        {mine && item.failed && <Text style={styles.failedText}>failed</Text>}
      </Wrapper>
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
          contentContainerStyle={{ paddingBottom: 120 }}
        />

        {typing && <Text style={styles.typingText}>Consultant is typing...</Text>}

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn} onPress={sendFileMessage}>
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

          <TouchableOpacity
            style={styles.sendBtn}
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

      {/* Image Modal */}
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

      {/* Rating Modal */}
      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={async (rating, comment) => {
          try {
            const roomRef = doc(db, "chatRooms", roomId);
            await updateDoc(roomRef, {
              rating: rating,
              ratingComment: comment,
              reviewerName, 
            });
            setRatingModalVisible(false);
          } catch (err) {
            console.log("Failed to submit rating:", err);
          }
        }}
      />
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
  unsentText: { fontStyle: "italic", opacity: 0.8 },
  statusText: { color: "#ccc", fontSize: 10, marginTop: 3 },
  failedText: { color: "#c33", fontSize: 10, marginTop: 3 },
  typingText: { marginLeft: 10, marginBottom: 4, color: "#4a4a4a" },
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
  sendBtnText: { color: "#fff", fontWeight: "700" },
  image: { width: 150, height: 150, borderRadius: 10 },
  imagePlaceholder: { width: 150, height: 150, justifyContent: "center", alignItems: "center", backgroundColor: "#ccc", borderRadius: 10 },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  modalImage: { width: "90%", height: "80%" },
});
