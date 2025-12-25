import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useSubscriptionType from "../../services/useSubscriptionType";
import BottomNavbar from "../components/BottomNav";

export default function Project() {
  const router = useRouter();
  const subType = useSubscriptionType();
  const [projects, setProjects] = useState([]);

  const loadProjects = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const projectKeys = keys.filter((k) =>
        k.startsWith("aestheticai:project-image:")
      );
      const items = await AsyncStorage.multiGet(projectKeys);

      const parsed = items.map(([key, value]) => {
        const data = JSON.parse(value);
        return {
          id: key,
          title: data.title || "Untitled Project",
          image: data.image,
          date: data.date || new Date().toISOString().split("T")[0],
          tag: data.tag || "Room",
        };
      });

      if (parsed.length === 0) {
        setProjects([
          {
            id: "static-1",
            title: "Modern Living Room",
            image: require("../../assets/livingroom.jpg"),
            date: "2025-12-20",
            tag: "Living Room",
          },
        ]);
      } else {
        setProjects(parsed);
      }
    } catch (err) {
      console.log("Error loading projects:", err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openVisualization = (project) => {
    router.push(`/User/RoomVisualization?id=${project.id}`);
  };

  // ✅ DELETE PROJECT (LONG PRESS)
  const handleDeleteProject = (projectId) => {
    Alert.alert(
      "Delete Project",
      "Are you sure you want to delete this project?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(projectId);
              loadProjects(); // refresh list
            } catch (e) {
              console.log("Delete error:", e);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* ===== HEADER ===== */}
      <View style={styles.chatHeaderRow}>
        <View style={styles.chatHeaderLeft}>
          <View style={styles.headerAvatar}>
            <Ionicons name="albums" size={20} color="#0F3E48" />
          </View>
          <View>
            <Text style={styles.chatTitle}>Saved Projects</Text>
            <Text style={styles.chatSubtitle}>
              {projects.length} project(s)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.headerDivider} />

      {/* ===== PROJECT LIST ===== */}
      <ScrollView contentContainerStyle={styles.gallery}>
        {projects.length > 0 ? (
          <View style={styles.grid}>
            {projects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => openVisualization(project)}
                onLongPress={() => handleDeleteProject(project.id)} // ✅ LONG PRESS
              >
                <Image
                  source={
                    typeof project.image === "string"
                      ? { uri: project.image }
                      : project.image
                  }
                  style={styles.image}
                  resizeMode="cover"
                />
                <View style={styles.overlay}>
                  <Text style={styles.title}>{project.title}</Text>
                  <Text style={styles.date}>{project.date}</Text>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{project.tag}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="image-outline" style={styles.emptyIcon} />
            </View>
            <Text style={styles.emptyText}>No AI projects yet</Text>
          </View>
        )}
      </ScrollView>

      <BottomNavbar subType={subType} />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F9FA",
  },

  chatHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F3E48",
  },
  chatSubtitle: {
    fontSize: 12,
    color: "#777",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#E4E6EB",
    marginBottom: 10,
  },

  gallery: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#FFF",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "#f1f1f1",
  },

  image: {
    width: "100%",
    height: 170,
  },

  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  title: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  date: {
    color: "#E1F5FE",
    fontSize: 12,
    marginTop: 2,
  },

  chip: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#FDE2E4",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
    color: "#C44569",
    fontWeight: "600",
  },

  emptyWrap: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyIconCircle: {
    backgroundColor: "#FDE2E4",
    borderRadius: 60,
    padding: 20,
    marginBottom: 14,
  },
  emptyIcon: {
    fontSize: 46,
    color: "#912f56",
  },
  emptyText: {
    textAlign: "center",
    color: "#912f56",
    fontStyle: "italic",
    fontSize: 17,
  },
});
