import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Vibration,
  Pressable,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import { useAppContext } from "../context/AppContext";

export function SOSAlarmModal({ visible, requestData, onClose }) {
  const { api, setRoute } = useAppContext();
  const [countdown, setCountdown] = useState(30);
  const soundRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const pulse = useRef(new Animated.Value(1)).current;

  const requestId = requestData?.requestId || requestData?.data?.requestId;
  const bloodGroup = requestData?.bloodGroup || requestData?.data?.bloodGroup || "N/A";
  const urgency = requestData?.urgency || requestData?.data?.urgency || "critical";
  const unitsNeeded = requestData?.unitsNeeded || requestData?.data?.unitsNeeded || "1";
  const distance = requestData?.distance || requestData?.data?.distance || "Nearby";

  useEffect(() => {
    if (!visible) return;

    // Start pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.6,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Start vibration
    Vibration.vibrate([500, 200, 500, 200, 500], true);

    // Play alarm sound
    let soundObj = null;
    (async () => {
      try {
        soundObj = new Audio.Sound();
        await soundObj.loadAsync(require("../../assets/sounds/sos_alarm.mp3"));
        await soundObj.setIsLoopingAsync(true);
        await soundObj.playAsync();
        soundRef.current = soundObj;
      } catch (err) {
        console.warn("Failed to play alarm audio", err.message);
      }
    })();

    // Start countdown
    setCountdown(30);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      // Cleanup sound
      if (soundRef.current) {
        const soundToStop = soundRef.current;
        soundRef.current = null;
        soundToStop.stopAsync()
          .then(() => soundToStop.unloadAsync())
          .catch((err) => console.log("Sound cleanup error:", err.message));
      }

      // Cleanup vibration
      Vibration.cancel();

      // Cleanup countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [visible, requestId]);

  const handleAccept = async () => {
    if (!requestId) {
      onClose();
      return;
    }
    try {
      await api(`/blood-requests/${requestId}/respond`, {
        method: "PUT",
        body: { response: "accepted", action: "accept" },
      });
      onClose();
      setRoute(`chat:${requestId}`);
    } catch (err) {
      Alert.alert("Response Failed", err.message);
    }
  };

  const handleDecline = async () => {
    if (!requestId) {
      onClose();
      return;
    }
    try {
      await api(`/blood-requests/${requestId}/respond`, {
        method: "PUT",
        body: { response: "declined", action: "decline" },
      });
      onClose();
    } catch (err) {
      Alert.alert("Response Failed", err.message);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="none">
      <Animated.View style={[styles.container, { opacity: pulse }]}>
        <View style={styles.content}>
          <Text style={styles.header}>🚨 EMERGENCY BLOOD REQUEST</Text>
          <Text style={styles.bloodGroup}>{bloodGroup}</Text>
          <Text style={styles.subtext}>Urgency: {urgency.toUpperCase()}</Text>
          <Text style={styles.subtext}>Units Needed: {unitsNeeded}</Text>
          <Text style={styles.distance}>Distance: {distance}</Text>
          <Text style={styles.countdown}>Closing in {countdown}s...</Text>
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={[styles.button, styles.btnAccept]} onPress={handleAccept}>
            <Text style={styles.btnText}>ACCEPT</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.btnDecline]} onPress={handleDecline}>
            <Text style={styles.btnText}>DECLINE</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B81531",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  bloodGroup: {
    color: "#FFF",
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtext: {
    color: "#FFF",
    fontSize: 18,
    marginVertical: 4,
  },
  distance: {
    color: "#FFF",
    fontSize: 16,
    marginVertical: 4,
    opacity: 0.9,
  },
  countdown: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 30,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 15,
    width: "100%",
  },
  button: {
    flex: 1,
    height: 55,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  btnAccept: {
    backgroundColor: "#16A34A",
  },
  btnDecline: {
    backgroundColor: "#4B5563",
  },
  btnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
