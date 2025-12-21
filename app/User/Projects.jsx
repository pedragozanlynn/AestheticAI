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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useSubscriptionType from "../../services/useSubscriptionType";
import BottomNavbar from "../components/BottomNav";

export default function Project() {
  const router = useRouter();
  const subType = useSubscriptionType();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
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
    loadProjects();
  }, []);

  const openVisualization = (project) => {
    router.push(`/User/RoomVisualization?id=${project.id}`);
  };

  return (
    <View style={styles.page}>
      {/* ✅ Aesthetic Header */}
      <View style={styles.titleWrap}>
        <Text style={styles.header}>Saved Projects</Text>
        <Text style={styles.subtitle}>
          All your AI‑generated room designs in one place
        </Text>
        <View style={styles.divider} />
      </View>

      <ScrollView contentContainerStyle={styles.gallery}>
        {projects.length > 0 ? (
          <View style={styles.grid}>
            {projects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => openVisualization(project)}
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

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F9FAFB" },

  // ✅ Header section
  titleWrap: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: "flex-start",
    backgroundColor: "#faf9f6", // soft pastel background
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24, // rounded bottom corners
  },
  header: {
    fontSize: 25,
    fontWeight: "800",
    color: "#912f56", // maroon accent
    letterSpacing: 1.5,
    textAlign: "left",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d", // softer gray
    marginTop: 2,
    fontStyle: "italic",
    textAlign: "left",
    lineHeight: 22,
  },
  divider: {
    width: "100%",
    height: 5,
    borderRadius: 3,
    marginTop: 11,
    marginBottom: 12,
    backgroundColor: "#912f56",
    shadowColor: "#1E90FF",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  gallery: { paddingHorizontal: 20, paddingBottom: 100 },

  // ✅ Grid layout
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
    shadowColor: "#912f56", // subtle colored shadow
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: "#f1f1f1",
  },
  image: {
    width: "100%",
    height: 170,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  title: { color: "#FFF", fontSize: 16, fontWeight: "700", textAlign: "left" },
  date: { color: "#E1F5FE", fontSize: 12, marginTop: 2, textAlign: "left" },

  chip: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#FDE2E4",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    shadowColor: "#912f56",
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
    shadowColor: "#912f56",
    shadowOpacity: 0.2,
    shadowRadius: 6,
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
    letterSpacing: 0.5,
  },
});
