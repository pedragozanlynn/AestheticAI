import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { listenToMessages } from "../../services/chatService";
import { pickFile } from "../../services/fileUploadService";
import { handleUnsendMessage } from "../../services/handleUnsendMessage";
import { useSendMessage } from "../../services/useSendMessage";

const TWELVE_HOURS = 12 * 60 * 60 * 1000;
const isAfter12Hours = (timestamp) => {
  if (!timestamp?.toDate) return false;
  return Date.now() - timestamp.toDate().getTime() > TWELVE_HOURS;
};

const formatLastSeen = (timestamp) => {
  if (!timestamp?.toDate) return "Active recently";
  const last = timestamp.toDate();
  const now = new Date();
  const diffMin = Math.floor((now - last) / 60000);
  if (diffMin < 1) return "Active just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return diffHr < 24 ? `${diffHr}h ago` : `${Math.floor(diffHr / 24)}d ago`;
};

export default function ChatRoom() {
  const router = useRouter();
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

  useEffect(() => {
    const loadProfile = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const profileKey = keys.find((k) => k.startsWith("aestheticai:user-profile:"));
      if (!profileKey) return;
      const parsed = JSON.parse(await AsyncStorage.getItem(profileKey));
      if (parsed?.uid) setConsultant({ id: parsed.uid, ...parsed });
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (!routeUserId) return;
    return onSnapshot(doc(db, "users", routeUserId), (snap) => {
      if (snap.exists()) setChatUser(snap.data());
    });
  }, [routeUserId]);

  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, "chatRooms", roomId), async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setRoomStatus(data.status);
      if (data.status !== "completed" && isAfter12Hours(data.createdAt)) {
        await updateDoc(doc(db, "chatRooms", roomId), {
          status: "completed",
          completedAt: new Date(),
        });
      }
    });
    return unsub;
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !consultant?.id) return;
    setLoading(true);
    unsubRef.current = listenToMessages(roomId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    setLoading(false);
    return () => unsubRef.current?.();
  }, [roomId, consultant]);

  const { sendTextMessage, sendFileMessage } = useSendMessage({
    roomId,
    senderId: consultant?.id,
    senderType: "consultant",
    setMessages,
  });

  const isCompleted = roomStatus === "completed";

  const handleSend = async () => {
    if (!text.trim() || isCompleted) return;
    const msg = text.trim();
    setText("");
    await sendTextMessage(msg);
  };

  const handleFileSend = async () => {
    if (isCompleted) return;
    const file = await pickFile();
    if (file) await sendFileMessage(file);
  };

  const confirmComplete = async () => {
    await updateDoc(doc(db, "chatRooms", roomId), {
      status: "completed",
      completedAt: new Date(),
    });
    setConfirmVisible(false);
  };

  const renderMsg = ({ item }) => {
    const isMe = item.senderType === "consultant";
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => isMe && !item.unsent && handleUnsendMessage(item, roomId)}
          style={[
            styles.messageBubble,
            isMe ? styles.myBubble : styles.theirBubble,
            item.unsent && styles.unsentBubble,
          ]}
        >
          <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText, item.unsent && styles.unsentText]}>
            {item.unsent ? "🚫 Message unsent" : item.text}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#0F3E48" />
        </TouchableOpacity>
        
        <View style={styles.headerProfile}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                chatUser?.gender === "Female"
                  ? require("../../assets/office-woman.png")
                  : require("../../assets/office-man.png")
              }
              style={styles.avatar}
            />
            {chatUser?.isOnline && <View style={styles.onlineDot} />}
          </View>
          <View>
            <Text style={styles.nameText} numberOfLines={1}>{chatUser?.name || "Client"}</Text>
            <Text style={styles.statusText}>
              {chatUser?.isOnline ? "Active now" : formatLastSeen(chatUser?.lastSeen)}
            </Text>
          </View>
        </View>

        {!isCompleted && (
          <TouchableOpacity onPress={() => setConfirmVisible(true)} style={styles.checkBtn}>
            <Ionicons name="checkmark-done-circle" size={28} color="#3FA796" />
          </TouchableOpacity>
        )}
      </View>

      {/* COMPLETED BANNER */}
      {isCompleted && (
        <View style={styles.completedBanner}>
          <Ionicons name="lock-closed" size={14} color="#64748B" />
          <Text style={styles.completedBannerText}>This consultation is marked as completed</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#01579B" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMsg}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* INPUT AREA */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <View style={[styles.inputWrapper, isCompleted && styles.disabledInput]}>
          <TouchableOpacity 
            onPress={handleFileSend} 
            disabled={isCompleted} 
            style={styles.attachmentBtn}
          >
            <Ionicons name="add-circle-outline" size={28} color={isCompleted ? "#CBD5E1" : "#01579B"} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            editable={!isCompleted}
            placeholder={isCompleted ? "Chat locked" : "Type a message..."}
            placeholderTextColor="#94A3B8"
            multiline
          />

          <TouchableOpacity
            style={[styles.sendButton, (!text.trim() || isCompleted) && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || isCompleted}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* CONFIRM MODAL */}
      <Modal transparent visible={confirmVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Ionicons name="checkmark-circle" size={40} color="#3FA796" />
            </View>
            <Text style={styles.modalTitle}>End Consultation?</Text>
            <Text style={styles.modalSubtitle}>This will close the chat permanently. You won't be able to send more messages.</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.cancelBtnText}>Keep Chatting</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmComplete}>
                <Text style={styles.confirmBtnText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 30 : 30,
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    elevation: 2,
  },
  backBtn: { padding: 5 },
  headerProfile: { flex: 1, flexDirection: "row", alignItems: "center", marginLeft: 10 },
  avatarContainer: { position: 'relative' },
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
  nameText: { fontSize: 16, fontWeight: "800", color: "#0F3E48", width: 180 , left: 10,},
  statusText: { fontSize: 12, color: "#64748B",left: 10, },
  checkBtn: { padding: 5 },

  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    gap: 6
  },
  completedBannerText: { fontSize: 12, color: "#64748B", fontWeight: '600' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 15, paddingVertical: 20, paddingBottom: 40 },

  messageWrapper: { marginVertical: 4, flexDirection: 'row', width: '100%' },
  myWrapper: { justifyContent: 'flex-end' },
  theirWrapper: { justifyContent: 'flex-start' },

  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: "#01579B",
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  unsentBubble: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  
  messageText: { fontSize: 15, lineHeight: 20 },
  myText: { color: "#FFF" },
  theirText: { color: "#1E293B" },
  unsentText: { color: "#94A3B8", fontStyle: 'italic' },

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
    paddingTop: 8,
    maxHeight: 100,
    fontSize: 15,
    color: "#1E293B",
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#01579B",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sendDisabled: { backgroundColor: "#CBD5E1" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 62, 72, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 30,
    padding: 25,
    width: "100%",
    alignItems: 'center'
  },
  modalIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0FDFA",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#0F3E48", marginBottom: 10 },
  modalSubtitle: { fontSize: 14, color: "#64748B", textAlign: 'center', lineHeight: 20, marginBottom: 25 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  cancelBtnText: { color: "#64748B", fontWeight: "700" },
  confirmBtn: {
    flex: 2,
    backgroundColor: "#3FA796",
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  confirmBtnText: { color: "#FFF", fontWeight: "800" },
});