import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
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
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { db } from "../../config/firebase";
import { listenToMessages, markUserChatAsRead } from "../../services/chatService";
import { pickFile } from "../../services/fileUploadService";
import { handleUnsendMessage } from "../../services/handleUnsendMessage";
import { useSendMessage } from "../../services/useSendMessage";
import RatingModal from "../components/RatingModal";

const THEME = {
  primary: "#01579B",
  bg: "#F8FAFC",
  textDark: "#0F3E48",
  textGray: "#64748B",
  completed: "#3FA796"
};

const formatActiveStatus = (isOnline, lastSeen) => {
  if (isOnline) return "Active now";
  if (!lastSeen?.toDate) return "Offline";
  const mins = Math.floor((Date.now() - lastSeen.toDate()) / 60000);
  if (mins < 1) return "Active just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
};

export default function UserChatRoom() {
  const router = useRouter();
  const { roomId, userId, consultantId } = useLocalSearchParams();
  const auth = getAuth();

  const [user, setUser] = useState(null);
  const [consultant, setConsultant] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(false);

  const flatListRef = useRef(null);

  /* ================= LOAD USER PROFILE ================= */
  useEffect(() => {
    const loadUser = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const key = keys.find((k) => k.startsWith("aestheticai:user-profile:"));
      if (!key) return;
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser({ ...parsed, uid: parsed.uid });
      }
    };
    loadUser();
  }, []);

  /* ================= LOAD CONSULTANT INFO ================= */
  useEffect(() => {
    if (!consultantId) return;
    return onSnapshot(doc(db, "consultants", consultantId), (snap) => {
      if (snap.exists()) setConsultant(snap.data());
    });
  }, [consultantId]);

  /* ================= ROOM STATUS & LOCKING ================= */
  useEffect(() => {
    if (!roomId || !userId || !consultantId) return;
    const ref = doc(db, "chatRooms", roomId);

    return onSnapshot(ref, (snap) => {
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
        const twelveHoursPassed = createdAt && Date.now() - createdAt.getTime() >= 12 * 60 * 60 * 1000;

        if ((data.status === "completed" || twelveHoursPassed) && !data.ratingSubmitted) {
          setRatingModalVisible(true);
        }
        setIsChatLocked(data.ratingSubmitted || data.status === "completed" || twelveHoursPassed);
      }
    });
  }, [roomId, userId, consultantId]);

  /* ================= MESSAGES LOGIC ================= */
  useEffect(() => {
    if (!roomId || !user) return;
    setLoading(true);
    const unsub = listenToMessages(roomId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    markUserChatAsRead(roomId).catch(() => {});
    setLoading(false);
    return () => unsub();
  }, [roomId, user]);

  const { sendTextMessage, sendFileMessage } = useSendMessage({
    roomId,
    senderId: user?.uid,
    senderType: "user",
    setMessages,
  });

  const confirmComplete = () => {
    Alert.alert(
      "End Consultation",
      "Are you sure you want to mark this consultation as complete? You won't be able to send more messages.",
      [
        { text: "Keep Chatting", style: "cancel" },
        { 
          text: "End Now", 
          onPress: async () => {
            await updateDoc(doc(db, "chatRooms", roomId), { status: "completed" });
          } 
        }
      ]
    );
  };

  const renderMessage = ({ item }) => {
    const mine = item.senderType === "user";
    return (
      <View style={[styles.messageWrapper, mine ? styles.myWrapper : styles.theirWrapper]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => mine && !item.unsent && handleUnsendMessage(item, roomId, user?.uid, setMessages)}
          style={[
            styles.messageBubble,
            mine ? styles.myBubble : styles.theirBubble,
          ]}
        >
          {item.type === "image" ? (
            <Image source={{ uri: item.fileUrl }} style={styles.imageMsg} />
          ) : (
            <Text style={[styles.messageText, mine ? styles.myText : styles.theirText]}>
              {item.unsent ? "🚫 Message unsent" : item.text}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      {/* MODERN WHITE HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={THEME.textDark} />
        </TouchableOpacity>

        <View style={styles.headerProfile}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                consultant?.gender === "Female"
                  ? require("../../assets/office-woman.png")
                  : require("../../assets/office-man.png")
              }
              style={styles.avatar}
            />
            {consultant?.isOnline && <View style={styles.onlineDot} />}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.nameText} numberOfLines={1}>
              {consultant?.fullName || "Consultant"}
            </Text>
            <Text style={styles.statusText}>
              {formatActiveStatus(consultant?.isOnline, consultant?.lastSeen)}
            </Text>
          </View>
        </View>

        {!isChatLocked && (
          <TouchableOpacity onPress={confirmComplete} style={styles.completeBtn}>
            <Ionicons name="checkmark-done-circle" size={30} color={THEME.completed} />
          </TouchableOpacity>
        )}
      </View>

      {isChatLocked && (
        <View style={styles.completedBanner}>
          <Ionicons name="lock-closed" size={14} color={THEME.textGray} />
          <Text style={styles.completedBannerText}>This consultation has ended</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={[styles.inputWrapper, isChatLocked && styles.disabledInput]}>
          <TouchableOpacity
            disabled={isChatLocked}
            onPress={async () => {
              const file = await pickFile();
              if (file) await sendFileMessage(file);
            }}
            style={styles.attachmentBtn}
          >
            <Ionicons name="add-circle-outline" size={30} color={isChatLocked ? "#CBD5E1" : THEME.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={text}
            editable={!isChatLocked}
            placeholder={isChatLocked ? "Chat locked" : "Type a message..."}
            placeholderTextColor="#94A3B8"
            onChangeText={setText}
            multiline
          />

          <TouchableOpacity
            style={[styles.sendButton, (!text.trim() || isChatLocked) && styles.sendDisabled]}
            disabled={!text.trim() || isChatLocked}
            onPress={async () => {
              if (!text.trim()) return;
              await sendTextMessage(text);
              setText("");
            }}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <RatingModal
        visible={ratingModalVisible}
        reviewerName={user?.fullName || user?.name || "Anonymous"}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={async ({ rating, feedback, reviewerName }) => {
          try {
            if (!auth.currentUser) return false;
            await addDoc(collection(db, "ratings"), {
              roomId,
              userId: auth.currentUser.uid,
              consultantId,
              rating,
              feedback,
              reviewerName,
              createdAt: serverTimestamp(),
            });
            await updateDoc(doc(db, "chatRooms", roomId), {
              ratingSubmitted: true,
              status: "completed",
            });
            await updateDoc(doc(db, "appointments", roomId.replace("appointment_", "")), {
              status: "completed",
            });
            return true;
          } catch (err) { return false; }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    elevation: 2,
  },
  backBtn: { padding: 5 },
  headerProfile: { flex: 1, flexDirection: "row", alignItems: "center", marginLeft: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F1F5F9" },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFF'
  },
  textContainer: { marginLeft: 10 },
  nameText: { fontSize: 16, fontWeight: "800", color: THEME.textDark, maxWidth: 160 },
  statusText: { fontSize: 12, color: THEME.textGray },
  completeBtn: { padding: 5 },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    gap: 6
  },
  completedBannerText: { fontSize: 12, color: THEME.textGray, fontWeight: '600' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 15, paddingVertical: 20, paddingBottom: 40 },
  messageWrapper: { marginVertical: 4, flexDirection: 'row', width: '100%' },
  myWrapper: { justifyContent: 'flex-end' },
  theirWrapper: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: "80%", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  myBubble: { backgroundColor: THEME.primary, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: "#FFF", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#F1F5F9" },
  messageText: { fontSize: 15, lineHeight: 20 },
  myText: { color: "#FFF" },
  theirText: { color: "#1E293B" },
  imageMsg: { width: 200, height: 150, borderRadius: 10 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  disabledInput: { backgroundColor: "#F8FAFC" },
  attachmentBtn: { marginRight: 10 },
  textInput: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
    color: "#1E293B",
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sendDisabled: { backgroundColor: "#CBD5E1" },
});