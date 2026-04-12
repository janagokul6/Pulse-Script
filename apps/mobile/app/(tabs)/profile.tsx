import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useState } from "react";
import {
  Alert,
  Image,
  View as RNView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PUBLISHED_CASES = [
  {
    id: "1",
    category: "CARDIOLOGY",
    title: "Advanced Aortic Arch Reconstruction in Elderly Patients",
    summary:
      "A comprehensive study on the efficacy of hybrid surgical approaches in 45 geriatric cases...",
    views: "1.2k",
    bookmarks: 85,
    featured: true,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCv9YhC3QWryiYGd3FGtM8WD7W61db-Xdmvdu_WCij6eiahzYbZDPGqxIphAsHsZOCpNAjK37tRGg9MvVrkQaPghYDZJ72V2A_heC_FwO9J14fFeQ9CZAsw_eyGN-nnyNi6AIEZfKWPFJwB8aHcq7dIne74IIxljbZ7V0x_KrRRjx111rrDTJczCSCyUqBkynRq9A_BE-p_o_c7r-jd1Wugtkvdl0d8m8dGY8jexkoepvAZTR5klZg_RkDyeib2_-3dR4FmhblSuWY",
  },
  {
    id: "2",
    category: "MICROBIOLOGY",
    title: "Post-Operative Myocarditis: A 5-Year Retrospective",
    summary:
      "Exploring early markers of cardiac inflammation following valve replacement surgeries...",
    views: "842",
    bookmarks: 42,
    date: "Oct 2023",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBmlS-1lTWO58E9Ufg5PWk-9mRdAYMoOrpdRe0qxBThn1doMpadWqJ2cEnPSK4gYtfTqbxnofT4-qrqRGFKGON6uYvj7gK0xx-1j70Aa0WJzXk_e_MecJx4m_9QTpSsa5lHMBc0qZZrZsGdBXb4EmUJNm4dzkwyBvHbqbckz479u-PGX_4lZdLYCactETABsh82sIUQWST39Q9sAT1FPI6Vzj0pTkwrPge4RJ4stMrE0pIyJCPaSDnaVTTsrDtk8FpCsve2huo8QB8",
  },
  {
    id: "3",
    category: "ROBOTICS",
    title: "Implementation of AI in Minimally Invasive Surgeries",
    summary:
      "The role of real-time imaging guidance in modern cardiac intervention...",
    views: "2.5k",
    bookmarks: 156,
    date: "Aug 2023",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB_0o86ZZ1_srcajqWzvHdUs5RK-MxgkcUdAlOyumN3ndwDH4UhM8qAGhzjKX1SkfDOapuhvoalbEyN5C3XhBYeiHLGUDS5zDnUnZzL3UVHdyhybWrNvbEujVChuU7rcCoR59MLB_BJK605UeogmKOwVhbm3iTLA6fdLgf8u4GyTWXfF7zwRBLFkC7_1r0DN6neHWvtHpWwwEsT-3BJNDxOdVTWaABmNsi5qnFidZ1fFC9KvaYLlER9xGaiJJcitx3Chws7vgvfG7s",
  },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState("About");
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [profileData, setProfileData] = useState({
    name: (user as any)?.name || "Dr. Alistair Thorne",
    specialization:
      (user as any)?.specialization || "Chief of Cardiovascular Surgery",
    registrationNumber: (user as any)?.registrationNumber || "MED-7821-UK",
    experienceYears: (user as any)?.experienceYears?.toString() || "22",
    patientsTreated: (user as any)?.patientsTreated?.toString() || "5000+",
    hospital: (user as any)?.hospital || "Royal Academy of Medicine",
    education: (user as any)?.education || "Harvard Medical School",
    researchInterests:
      (user as any)?.researchInterests ||
      "Robotic Surgery, Aortic Arch Reconstruction",
    certifications:
      (user as any)?.certifications || "American Board of Thoracic Surgery",
    memberships:
      (user as any)?.memberships ||
      "Fellow of Royal College of Surgeons (FRCS)",
    languages: (user as any)?.languages || "English, French",
    bio:
      (user as any)?.bio ||
      "Dedicated to advancing cardiovascular surgery and patient care through innovative techniques.",
  });

  const confirmLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout() },
    ]);
  };

  const avatarUrl =
    (user as any)?.avatarUrl ||
    (user as any)?.avatar ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBL1Rnx5XoM4wF_gvNeEAKSHRXpbvLE9jZE_rdzztNd92-BRuzQg495a565d7kw8oB_Is4VSsYvAX8eMf7z0DWVwsdLqktI1eKrUe--9jjLqXBQ_tLftZfMUm4DCDASyFVLotHDndg9REdwgFW-h6vYereLyqIHsRJ-mJcU2AmUg3xIVOfAg7yKOxMF-aCZcfQT6PSj1PQhKzVbQD4L1NdNK1It5hJEFa3pXKXWvixD2yNwHnGZe3QTrA0lb5u7Z84T8qWpZKplCZA";

  return (
    <RNView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <RNView
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIcon}
        >
          <SymbolView
            name={{
              ios: "arrow.left",
              android: "arrow_back",
              web: "arrow_back",
            }}
            tintColor={theme.tint}
            size={24}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Medical Fellow Profile
        </Text>
        <RNView style={styles.headerRightActions}>
          <TouchableOpacity style={styles.headerIcon}>
            <SymbolView
              name={{
                ios: "square.and.arrow.up",
                android: "share",
                web: "share",
              }}
              tintColor={theme.tint}
              size={22}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={confirmLogout}
            style={[styles.headerIcon, { marginLeft: 8 }]}
          >
            <SymbolView
              name={{
                ios: "rectangle.portrait.and.arrow.right",
                android: "logout",
                web: "logout",
              }}
              tintColor="#ef4444"
              size={22}
            />
          </TouchableOpacity>
        </RNView>
      </RNView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]}
      >
        {/* Profile Hero Section */}
        <RNView
          style={[
            styles.heroSection,
            {
              backgroundColor: theme.background,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <RNView style={styles.avatarContainer}>
            <Image
              source={{ uri: avatarUrl }}
              style={[styles.avatarImage, { borderColor: theme.tint + "1a" }]}
            />
            <RNView style={styles.verifiedBadge}>
              <SymbolView
                name={{
                  ios: "checkmark.seal.fill",
                  android: "verified",
                  web: "verified",
                }}
                tintColor="#fff"
                size={14}
              />
            </RNView>
          </RNView>

          <RNView style={styles.nameHeader}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {profileData.name}
            </Text>
            <Text style={[styles.profileTitle, { color: theme.tint }]}>
              {profileData.specialization}
            </Text>
            <Text
              style={[styles.profileCredentials, { color: theme.secondary }]}
            >
              {profileData.hospital} • {profileData.experienceYears} years
              experience
            </Text>
          </RNView>
        </RNView>

        {/* Stats Section */}
        <RNView style={[styles.statsSection, { backgroundColor: theme.card }]}>
          <RNView
            style={[
              styles.statBox,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Text style={styles.statLabel}>EXPERIENCE</Text>
            <RNView style={styles.statValueRow}>
              <Text style={[styles.statValueDark, { color: theme.text }]}>
                {profileData.experienceYears}
              </Text>
              <Text
                style={[
                  styles.statValueDark,
                  { color: theme.text, fontSize: 14 },
                ]}
              >
                yrs
              </Text>
            </RNView>
            <Text style={[styles.statHelper, { color: theme.secondary }]}>
              Clinical Practice
            </Text>
          </RNView>

          <RNView
            style={[
              styles.statBox,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <Text style={styles.statLabel}>PATIENTS</Text>
            <RNView style={styles.statValueRow}>
              <Text style={[styles.statValueDark, { color: theme.text }]}>
                {profileData.patientsTreated}
              </Text>
              <SymbolView
                name={{
                  ios: "person.crop.circle.badge.checkmark",
                  android: "how_to_reg",
                  web: "how_to_reg",
                }}
                tintColor={theme.tint}
                size={16}
              />
            </RNView>
            <Text style={[styles.statHelper, { color: theme.secondary }]}>
              Treated
            </Text>
          </RNView>

          <RNView
            style={[
              styles.statBox,
              { backgroundColor: theme.background, borderColor: "#d4af3733" },
            ]}
          >
            <Text style={styles.statLabel}>CASES</Text>
            <RNView style={styles.statValueRow}>
              <Text style={styles.statValueAccent}>24</Text>
              <SymbolView
                name={{
                  ios: "doc.text.fill",
                  android: "article",
                  web: "article",
                }}
                tintColor="#d4af37"
                size={16}
              />
            </RNView>
            <Text style={[styles.statHelper, { color: theme.tint }]}>
              Published
            </Text>
          </RNView>
        </RNView>

        {/* Tabs */}
        <RNView
          style={{
            width: "100%",
            backgroundColor: theme.background,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}
        >
          <RNView style={styles.tabsHeader}>
            {["About", "Library", "Research", "Reviews"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabItem,
                  activeTab === tab && { borderBottomColor: theme.tint },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab
                      ? { color: theme.tint }
                      : { color: theme.secondary },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </RNView>
        </RNView>

        {/* Content Area */}
        {activeTab === "About" ? (
          <RNView style={[styles.aboutContent, { paddingBottom: 24 }]}>
            <RNView style={styles.aboutHeader}>
              <Text style={[styles.aboutTitle, { color: theme.text }]}>
                About
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditingAbout(!isEditingAbout)}
              >
                <Text style={{ color: theme.tint, fontWeight: "600" }}>
                  {isEditingAbout ? "Save" : "Edit"}
                </Text>
              </TouchableOpacity>
            </RNView>
            <RNView
              style={[
                styles.aboutCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              {isEditingAbout ? (
                <RNView style={styles.formContainer}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Basic Information
                  </Text>
                  <RNView style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: theme.secondary }]}
                    >
                      Full Name
                    </Text>
                    <TextInput
                      style={[
                        styles.inputField,
                        {
                          color: theme.text,
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                      value={profileData.name}
                      onChangeText={(text) =>
                        setProfileData({ ...profileData, name: text })
                      }
                      placeholderTextColor={theme.secondary}
                    />
                  </RNView>
                  <RNView style={styles.inputRow}>
                    <RNView style={[styles.inputGroup, { flex: 1 }]}>
                      <Text
                        style={[styles.inputLabel, { color: theme.secondary }]}
                      >
                        Specialization
                      </Text>
                      <TextInput
                        style={[
                          styles.inputField,
                          {
                            color: theme.text,
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                          },
                        ]}
                        value={profileData.specialization}
                        onChangeText={(text) =>
                          setProfileData({
                            ...profileData,
                            specialization: text,
                          })
                        }
                        placeholderTextColor={theme.secondary}
                      />
                    </RNView>
                    <RNView
                      style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}
                    >
                      <Text
                        style={[styles.inputLabel, { color: theme.secondary }]}
                      >
                        License No.
                      </Text>
                      <TextInput
                        style={[
                          styles.inputField,
                          {
                            color: theme.text,
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                          },
                        ]}
                        value={profileData.registrationNumber}
                        onChangeText={(text) =>
                          setProfileData({
                            ...profileData,
                            registrationNumber: text,
                          })
                        }
                        placeholder="e.g. MED-7821"
                        placeholderTextColor={theme.secondary}
                      />
                    </RNView>
                  </RNView>

                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.text, marginTop: 12 },
                    ]}
                  >
                    Experience & Education
                  </Text>
                  <RNView style={styles.inputRow}>
                    <RNView style={[styles.inputGroup, { flex: 1 }]}>
                      <Text
                        style={[styles.inputLabel, { color: theme.secondary }]}
                      >
                        Experience (Yrs)
                      </Text>
                      <TextInput
                        style={[
                          styles.inputField,
                          {
                            color: theme.text,
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                          },
                        ]}
                        value={profileData.experienceYears}
                        onChangeText={(text) =>
                          setProfileData({
                            ...profileData,
                            experienceYears: text,
                          })
                        }
                        placeholderTextColor={theme.secondary}
                        keyboardType="numeric"
                      />
                    </RNView>
                    <RNView
                      style={[styles.inputGroup, { flex: 2, marginLeft: 12 }]}
                    >
                      <Text
                        style={[styles.inputLabel, { color: theme.secondary }]}
                      >
                        Hospital / Clinic
                      </Text>
                      <TextInput
                        style={[
                          styles.inputField,
                          {
                            color: theme.text,
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                          },
                        ]}
                        value={profileData.hospital}
                        onChangeText={(text) =>
                          setProfileData({ ...profileData, hospital: text })
                        }
                        placeholderTextColor={theme.secondary}
                      />
                    </RNView>
                  </RNView>
                  <RNView style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: theme.secondary }]}
                    >
                      Education & Alumni
                    </Text>
                    <TextInput
                      style={[
                        styles.inputField,
                        {
                          color: theme.text,
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                      value={profileData.education}
                      onChangeText={(text) =>
                        setProfileData({ ...profileData, education: text })
                      }
                      placeholder="e.g. Harvard Medical School"
                      placeholderTextColor={theme.secondary}
                    />
                  </RNView>

                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.text, marginTop: 12 },
                    ]}
                  >
                    Professional Interests
                  </Text>
                  <RNView style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: theme.secondary }]}
                    >
                      Research Interests
                    </Text>
                    <TextInput
                      style={[
                        styles.inputField,
                        {
                          color: theme.text,
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                      value={profileData.researchInterests}
                      onChangeText={(text) =>
                        setProfileData({
                          ...profileData,
                          researchInterests: text,
                        })
                      }
                      placeholder="e.g. Robotic Surgery, Cardiology"
                      placeholderTextColor={theme.secondary}
                    />
                  </RNView>
                  <RNView style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: theme.secondary }]}
                    >
                      Board Certifications
                    </Text>
                    <TextInput
                      style={[
                        styles.inputField,
                        {
                          color: theme.text,
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                      value={profileData.certifications}
                      onChangeText={(text) =>
                        setProfileData({ ...profileData, certifications: text })
                      }
                      placeholderTextColor={theme.secondary}
                    />
                  </RNView>
                  <RNView style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: theme.secondary }]}
                    >
                      Memberships
                    </Text>
                    <TextInput
                      style={[
                        styles.inputField,
                        {
                          color: theme.text,
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                      value={profileData.memberships}
                      onChangeText={(text) =>
                        setProfileData({ ...profileData, memberships: text })
                      }
                      placeholder="e.g. AMA, FRCS"
                      placeholderTextColor={theme.secondary}
                    />
                  </RNView>
                  <RNView style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: theme.secondary }]}
                    >
                      Languages Spoken
                    </Text>
                    <TextInput
                      style={[
                        styles.inputField,
                        {
                          color: theme.text,
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                      value={profileData.languages}
                      onChangeText={(text) =>
                        setProfileData({ ...profileData, languages: text })
                      }
                      placeholder="e.g. English, French"
                      placeholderTextColor={theme.secondary}
                    />
                  </RNView>

                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.text, marginTop: 12 },
                    ]}
                  >
                    Biography
                  </Text>
                  <RNView style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: theme.secondary }]}
                    >
                      Bio Details
                    </Text>
                    <TextInput
                      style={[
                        styles.inputField,
                        styles.textArea,
                        {
                          color: theme.text,
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                      value={profileData.bio}
                      onChangeText={(text) =>
                        setProfileData({ ...profileData, bio: text })
                      }
                      multiline
                      placeholderTextColor={theme.secondary}
                      textAlignVertical="top"
                    />
                  </RNView>
                </RNView>
              ) : (
                <RNView style={styles.detailsContainer}>
                  <RNView style={styles.detailRow}>
                    <RNView style={[styles.detailItem, { flex: 1 }]}>
                      <Text
                        style={[styles.detailLabel, { color: theme.secondary }]}
                      >
                        Specialization
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>
                        {profileData.specialization}
                      </Text>
                    </RNView>
                    <RNView style={[styles.detailItem, { flex: 1 }]}>
                      <Text
                        style={[styles.detailLabel, { color: theme.secondary }]}
                      >
                        License No.
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>
                        {profileData.registrationNumber}
                      </Text>
                    </RNView>
                  </RNView>
                  <RNView style={styles.detailRow}>
                    <RNView style={[styles.detailItem, { flex: 1 }]}>
                      <Text
                        style={[styles.detailLabel, { color: theme.secondary }]}
                      >
                        Experience
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>
                        {profileData.experienceYears} years
                      </Text>
                    </RNView>
                    <RNView style={[styles.detailItem, { flex: 1 }]}>
                      <Text
                        style={[styles.detailLabel, { color: theme.secondary }]}
                      >
                        Affiliation
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>
                        {profileData.hospital}
                      </Text>
                    </RNView>
                  </RNView>
                  <RNView style={styles.detailItem}>
                    <Text
                      style={[styles.detailLabel, { color: theme.secondary }]}
                    >
                      Education
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {profileData.education}
                    </Text>
                  </RNView>
                  <RNView style={styles.detailItem}>
                    <Text
                      style={[styles.detailLabel, { color: theme.secondary }]}
                    >
                      Research Interests
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {profileData.researchInterests}
                    </Text>
                  </RNView>
                  <RNView style={styles.detailRow}>
                    <RNView style={[styles.detailItem, { flex: 1 }]}>
                      <Text
                        style={[styles.detailLabel, { color: theme.secondary }]}
                      >
                        Certifications
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>
                        {profileData.certifications}
                      </Text>
                    </RNView>
                    <RNView style={[styles.detailItem, { flex: 1 }]}>
                      <Text
                        style={[styles.detailLabel, { color: theme.secondary }]}
                      >
                        Languages
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>
                        {profileData.languages}
                      </Text>
                    </RNView>
                  </RNView>
                  <RNView style={styles.detailItem}>
                    <Text
                      style={[styles.detailLabel, { color: theme.secondary }]}
                    >
                      Memberships
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {profileData.memberships}
                    </Text>
                  </RNView>
                  <RNView
                    style={[
                      styles.detailItem,
                      { borderBottomWidth: 0, paddingBottom: 0 },
                    ]}
                  >
                    <Text
                      style={[styles.detailLabel, { color: theme.secondary }]}
                    >
                      Bio
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: theme.text, lineHeight: 22 },
                      ]}
                    >
                      {profileData.bio}
                    </Text>
                  </RNView>
                </RNView>
              )}
            </RNView>
          </RNView>
        ) : activeTab === "Library" ? (
          <RNView style={[styles.libraryContent, { paddingBottom: 24 }]}>
            <RNView style={styles.libraryHeader}>
              <Text style={[styles.libraryTitle, { color: theme.text }]}>
                Published Case Studies
              </Text>
              <TouchableOpacity>
                <Text style={[styles.filterText, { color: theme.tint }]}>
                  Filter Library
                </Text>
              </TouchableOpacity>
            </RNView>

            {PUBLISHED_CASES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.caseCard,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Image source={{ uri: item.image }} style={styles.caseImage} />
                <RNView style={styles.caseDetails}>
                  <RNView>
                    <RNView
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: theme.tint + "15" },
                      ]}
                    >
                      <Text
                        style={[styles.categoryText, { color: theme.tint }]}
                      >
                        {item.category}
                      </Text>
                    </RNView>
                    <Text
                      style={[styles.caseTitle, { color: theme.text }]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.caseSummary, { color: theme.secondary }]}
                      numberOfLines={2}
                    >
                      {item.summary}
                    </Text>
                  </RNView>

                  <RNView style={styles.caseMetrics}>
                    <RNView style={styles.metric}>
                      <SymbolView
                        name={{
                          ios: "eye",
                          android: "visibility",
                          web: "visibility",
                        }}
                        tintColor={theme.secondary}
                        size={14}
                      />
                      <Text
                        style={[styles.metricText, { color: theme.secondary }]}
                      >
                        {item.views}
                      </Text>
                    </RNView>
                    <RNView style={styles.metric}>
                      <SymbolView
                        name={{
                          ios: "bookmark",
                          android: "bookmark",
                          web: "bookmark",
                        }}
                        tintColor={theme.secondary}
                        size={14}
                      />
                      <Text
                        style={[styles.metricText, { color: theme.secondary }]}
                      >
                        {item.bookmarks}
                      </Text>
                    </RNView>
                    {item.featured ? (
                      <RNView style={styles.metric}>
                        <SymbolView
                          name={{
                            ios: "star.circle.fill",
                            android: "award_star",
                            web: "award_star",
                          }}
                          tintColor="#d4af37"
                          size={14}
                        />
                        <Text
                          style={[
                            styles.metricText,
                            { color: "#d4af37", fontWeight: "700" },
                          ]}
                        >
                          Featured
                        </Text>
                      </RNView>
                    ) : (
                      <Text
                        style={[
                          styles.metricText,
                          { color: theme.secondary, fontWeight: "500" },
                        ]}
                      >
                        {item.date}
                      </Text>
                    )}
                  </RNView>
                </RNView>
              </TouchableOpacity>
            ))}
          </RNView>
        ) : (
          <RNView style={[styles.emptyContent, { paddingBottom: 24 }]}>
            <Text style={[styles.emptyText, { color: theme.secondary }]}>
              {activeTab} content coming soon.
            </Text>
          </RNView>
        )}
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  heroSection: {
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#d4af37",
    padding: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  nameHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: "center",
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  profileCredentials: {
    fontSize: 14,
    textAlign: "center",
  },
  statsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  statValueAccent: {
    fontSize: 20,
    fontWeight: "800",
    color: "#d4af37",
    letterSpacing: -0.5,
  },
  statValueDark: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statHelper: {
    fontSize: 10,
    fontWeight: "700",
  },
  tabsHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    flex: 1,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
  },
  libraryContent: {
    padding: 16,
    gap: 16,
  },
  libraryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  libraryTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
  },
  caseCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  caseImage: {
    width: 96,
    height: 128,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  caseDetails: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 20,
  },
  caseSummary: {
    fontSize: 12,
    lineHeight: 18,
  },
  caseMetrics: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricText: {
    fontSize: 10,
  },
  emptyContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  aboutContent: {
    padding: 16,
    gap: 16,
  },
  aboutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  aboutCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  inputRow: {
    flexDirection: "row",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
  },
  detailsContainer: {
    gap: 16,
  },
  detailItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#33415522",
    paddingBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    gap: 24,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
});
