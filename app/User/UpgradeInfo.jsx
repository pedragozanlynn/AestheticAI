import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform } from "react-native";
import { useRouter } from "expo-router";

export default function UpgradeInfo() {
  const router = useRouter();

  return (
    <View style={styles.page}>
      {/* Dark content status bar para sa malinis na look */}
      <StatusBar barStyle="dark-content" backgroundColor="#FDFEFF" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER - Dark Teal Title */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#2c4f4f" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium Plan</Text>
        </View>

        {/* HERO SECTION */}
        <View style={styles.heroContainer}>
            <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={16} color="#01579B" />
                <Text style={styles.badgeText}>EXCLUSIVE ACCESS</Text>
            </View>
            <Text style={styles.title}>Unlock All Premium Features</Text>
            <Text style={styles.subtitle}>
                Transform your space with full access to our elite AI tools and expert consultations.
            </Text>
        </View>

        {/* FEATURE LIST CARD - Deep Blue & Dark Teal Accents */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>WHAT'S INCLUDED</Text>
          
          <FeatureRow icon="color-wand" text="Unlimited AI Room Designs" />
          <FeatureRow icon="chatbubble-ellipses" text="1-on-1 Chat with Consultants" />
          <FeatureRow icon="sparkles" text="Premium Tools & Suggestions" />
          <FeatureRow icon="shield-checkmark" text="Priority Customer Support" />
        </View>

        {/* PRICE BOX - Dark Teal Price */}
        <View style={styles.priceBox}>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>₱</Text>
            <Text style={styles.price}>499</Text>
            <Text style={styles.perMonth}>/mo</Text>
          </View>
          <Text style={styles.cancelText}>Cancel anytime. No hidden fees.</Text>
        </View>

        {/* BUTTON - Bright Teal-Green (Consultant Style) */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.upgradeButton}
          onPress={() => router.push("/User/UpgradePayment")}
        >
          <Text style={styles.upgradeText}>Continue to Upgrade</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const FeatureRow = ({ icon, text }) => (
    <View style={styles.row}>
        <View style={styles.iconWrapper}>
            <Ionicons name={icon} size={20} color="#01579B" />
        </View>
        <Text style={styles.feature}>{text}</Text>
        {/* Green checkmark para sa visual confirmation */}
        <Ionicons name="checkmark-circle" size={22} color="#3fa796" style={{marginLeft: 'auto'}} />
    </View>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FDFEFF",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    marginBottom: 20,
  },
  backCircle: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2c4f4f',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2c4f4f", // Dark Teal
    marginLeft: 15,
  },
  heroContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginVertical: 10,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF', // Soft Light Blue
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
    gap: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#01579B', // Deep Blue
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2c4f4f", // Dark Teal
    textAlign: "center",
    lineHeight: 34,
  },
  subtitle: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 25,
    borderRadius: 25,
    padding: 24,
    marginTop: 30,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 5,
    shadowColor: '#2c4f4f',
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 15,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feature: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "600",
  },
  priceBox: {
    alignItems: "center",
    marginTop: 35,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 24,
    fontWeight: '700',
    color: "#2c4f4f",
    marginRight: 2,
  },
  price: {
    fontSize: 54,
    fontWeight: "900",
    color: "#2c4f4f", // Dark Teal
    letterSpacing: -2,
  },
  perMonth: {
    fontSize: 18,
    color: "#64748B",
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 5,
  },
  upgradeButton: {
    backgroundColor: "#3fa796", // Bright Teal-Green (Consultant Color)
    marginHorizontal: 30,
    height: 65,
    borderRadius: 22,
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#3fa796",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  upgradeText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 0.5,
  },
});