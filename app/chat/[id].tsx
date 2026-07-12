import React, { useState, useRef, useEffect } from "react";
import { 
  View, Text, FlatList, TextInput, TouchableOpacity, 
  Image, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { COLORS } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatScreen() {
  const { id, partnerId } = useLocalSearchParams();
  const conversationId = id as any;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const messages = useQuery(api.chat.getMessages, { conversationId });
  const partnerUser = useQuery(api.users.getUserProfile, { id: partnerId as any });
  const sendMessage = useMutation(api.chat.sendMessage);
  const generateUploadUrl = useMutation(api.chat.generateUploadUrl);
  const currentUser = useQuery(api.users.currentUser);

  const [text, setText] = useState("");
  
  // Audio recording states
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isPreparingRef = useRef(false);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  // 1. Send Text Message
  const handleSendText = async () => {
    if (!text.trim()) return;
    try {
      await sendMessage({ conversationId, content: text });
      setText("");
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Select and Send Image
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled) return;

    try {
      const localUri = result.assets[0].uri;
      const uploadUrl = await generateUploadUrl();
      
      const response = await fetch(localUri);
      const blob = await response.blob();
      
      const sendResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });
      const { storageId } = await sendResult.json();

      await sendMessage({ conversationId, imageStorageId: storageId });
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося надіслати фото");
      console.error(error);
    }
  };

  // 3. Audio Recording
  const startRecording = async () => {
    if (isPreparingRef.current || recordingRef.current) return;
    isPreparingRef.current = true;
    
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Дозвіл відхилено", "Дозвольте доступ до мікрофона");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = newRecording;
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error("Помилка старту запису", err);
    } finally {
      isPreparingRef.current = false;
    }
  };

  const stopRecording = async () => {
    const currentRec = recordingRef.current;
    if (!currentRec) return;

    recordingRef.current = null;
    setRecording(null);
    setIsRecording(false);

    try {
      await currentRec.stopAndUnloadAsync();
      const uri = currentRec.getURI();

      if (!uri) return;

      const status = await currentRec.createNewLoadedSoundAsync();
      const durationMs = status.status.isLoaded ? (status.status.durationMillis ?? 0) : 0;
      const durationSec = Math.round(durationMs / 1000) || 1;

      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "audio/m4a" },
        body: blob,
      });
      const { storageId } = await uploadResponse.json();

      await sendMessage({ 
        conversationId, 
        audioStorageId: storageId, 
        audioDuration: durationSec 
      });

    } catch (err) {
      console.error("Помилка зупинки запису", err);
    }
  };

  const handleRecordToggle = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const playAudio = async (url: string, messageId: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        if (playingMessageId === messageId) {
          setPlayingMessageId(null);
          return;
        }
      }
      setPlayingMessageId(messageId);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingMessageId(null);
        }
      });
    } catch (error) {
      console.error("Помилка відтворення аудіо", error);
      setPlayingMessageId(null);
    }
  };

  if (currentUser === undefined || partnerUser === undefined) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 45}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Image 
          source={{ uri: partnerUser?.image ?? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde" }} 
          style={styles.headerAvatar} 
        />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {partnerUser?.fullname ?? partnerUser?.name ?? "Користувач"}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            @{partnerUser?.username ?? "user"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        style={styles.messagesList}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Почніть розмову...</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMe = item.senderId === currentUser?._id;
          const isPlaying = playingMessageId === item._id;
          return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.partnerMessage]}>
              {/* Text */}
              {item.content && (
                <Text style={[styles.messageText, isMe ? styles.myText : styles.partnerText]}>
                  {item.content}
                </Text>
              )}
              
              {/* Image */}
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" />
              )}

              {/* Voice Message */}
              {item.audioUrl && (
                <TouchableOpacity 
                  style={styles.audioContainer}
                  onPress={() => playAudio(item.audioUrl!, item._id)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={isPlaying ? "pause-circle" : "play-circle"} 
                    size={36} 
                    color={isMe ? COLORS.white : COLORS.primary} 
                  />
                  <Text style={[styles.audioText, isMe ? styles.myText : styles.partnerText]}>
                    Голосове повідомлення ({item.audioDuration ?? 0}с)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Input panel */}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={handlePickImage} style={styles.iconButton}>
          <Ionicons name="image-outline" size={26} color={COLORS.grey} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Напишіть повідомлення..."
          placeholderTextColor={COLORS.grey}
          value={text}
          onChangeText={setText}
        />

        <TouchableOpacity 
          onPress={handleRecordToggle}
          style={[styles.iconButton, isRecording && styles.recordingActive]}
        >
          <Ionicons 
            name={isRecording ? "mic" : "mic-outline"} 
            size={26} 
            color={isRecording ? "red" : COLORS.grey} 
          />
        </TouchableOpacity>

        {text.trim().length > 0 && (
          <TouchableOpacity onPress={handleSendText} style={styles.sendButton}>
            <Ionicons name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: COLORS.white 
  },
  headerSubtitle: { 
    fontSize: 12, 
    color: COLORS.grey,
    marginTop: 1,
  },
  messagesList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: "80%",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  partnerMessage: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 2,
  },
  messageText: { 
    fontSize: 16,
    lineHeight: 20,
  },
  myText: { 
    color: COLORS.white 
  },
  partnerText: { 
    color: COLORS.white 
  },
  messageImage: { 
    width: 220, 
    height: 220, 
    borderRadius: 12, 
    marginTop: 4 
  },
  audioContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10,
    paddingRight: 8,
  },
  audioText: { 
    fontSize: 14, 
    fontWeight: "500" 
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
    paddingBottom: Platform.OS === "ios" ? 30 : 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontSize: 16,
    color: COLORS.white,
  },
  iconButton: { 
    padding: 4 
  },
  recordingActive: {
    transform: [{ scale: 1.25 }],
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.grey,
    fontSize: 16,
  },
});
