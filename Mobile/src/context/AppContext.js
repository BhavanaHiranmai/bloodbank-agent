import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Alert, Platform, BackHandler, Vibration } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { io } from "socket.io-client";
import * as Notifications from "expo-notifications";
import { registerForPushNotifications, unregisterPushToken } from "../utils/pushSetup";
import { theme } from "../styles/theme";

const AppContext = createContext();

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
export const TOKEN_KEY = "bloodlink_token";


const envUrl = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE =
  envUrl && envUrl.trim().length > 0
    ? envUrl.trim().replace(/\/$/, "")
    : "http://172.20.10.6:3000/api";

// Socket URL is the root (strip /api suffix)
export const SOCKET_URL = API_BASE.replace(/\/api\/?$/, "");

const SOS_ALERT_DURATION_MS = 60 * 1000;

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const empty = {
  donorStats: { totalDonations: 0, points: 0, badges: [] },
  eligibility: {},
};

export const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

export const titleCase = (value = "") =>
  value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const useForm = (initial) => {
  const [form, setForm] = useState(initial);
  const setField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));
  return [form, setField, setForm];
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [route, setRouteState] = useState("home");
  const [routeHistory, setRouteHistory] = useState([]);
  const [sageMode, setSageMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [activeSos, setActiveSos] = useState(null);
  const [sosAlarmVisible, setSosAlarmVisible] = useState(false);
  const [sosAlarmData, setSosAlarmData] = useState(null);
  const [eligibilityTick, setEligibilityTick] = useState(0);
  const [donationTick, setDonationTick] = useState(0);

  const setRoute = useCallback((newRoute) => {
    setRouteState((current) => {
      const resolved = typeof newRoute === "function" ? newRoute(current) : newRoute;
      if (resolved !== current) {
        setRouteHistory((prev) => {
          // Do not push duplicates to history
          if (prev[prev.length - 1] === current) {
            return prev;
          }
          return [...prev, current];
        });
      }
      return resolved;
    });
  }, []);

  const goBack = useCallback(() => {
    let handled = false;
    setRouteHistory((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const previousRoute = copy.pop();
      setRouteState(previousRoute);
      handled = true;
      return copy;
    });
    return handled;
  }, []);

  const canGoBack = routeHistory.length > 0;

  // Load sage mode from storage
  useEffect(() => {
    AsyncStorage.getItem("bloodlink_sage_mode").then((saved) => {
      if (saved === "true") {
        setSageMode(true);
      }
    });
  }, []);

  const toggleSageMode = useCallback((val) => {
    const newVal = typeof val === "boolean" ? val : !sageMode;
    setSageMode(newVal);
    AsyncStorage.setItem("bloodlink_sage_mode", newVal ? "true" : "false");
  }, [sageMode]);

  // Synchronize sage mode with global.sageModeActive and theme.colors
  useEffect(() => {
    global.sageModeActive = sageMode;
    if (sageMode) {
      theme.colors.primary = "#5A8264";
      theme.colors.primaryDark = "#436049";
      theme.colors.accent = "#5A8264";
      theme.colors.bg = "#F3F7F4";
      theme.colors.surfaceTint = "#E6EFEA";
      theme.colors.border = "#DCE5DD";
      theme.colors.borderLight = "#EBF1EC";
      theme.colors.bubbleMine = "#E6EFEA";
      theme.colors.skeletonB = "#E6EFEA";
      theme.colors.avatarBg = "#D0E1D4";
    } else {
      theme.colors.primary = "#E21E42";
      theme.colors.primaryDark = "#B81531";
      theme.colors.accent = "#E21E42";
      theme.colors.bg = "#FFF5F6";
      theme.colors.surfaceTint = "#FFF0F2";
      theme.colors.border = "#FAD9DD";
      theme.colors.borderLight = "#FCE8EB";
      theme.colors.bubbleMine = "#FFF0F2";
      theme.colors.skeletonB = "#FFF0F2";
      theme.colors.avatarBg = "#FEE2E2";
    }
  }, [sageMode]);

  // Clear route history on user status change
  useEffect(() => {
    setRouteHistory([]);
  }, [user?.role, user?._id]);

  // BackHandler setup
  useEffect(() => {
    const handleBackPress = () => {
      if (routeHistory.length > 0) {
        goBack();
        return true; // prevent default (app exit)
      }
      return false; // let default happen (app exit)
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => {
      subscription.remove();
    };
  }, [routeHistory, goBack]);
  // Connection status: 'unknown' | 'connected' | 'disconnected'
  const [serverStatus, setServerStatus] = useState("unknown");
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const sosAlertTimer = useRef(null);
  const notificationResponseListener = useRef(null);

  // ── Health check ────────────────────────────────────────────────────────────
  const checkServer = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${API_BASE.replace(/\/api\/?$/, "")}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        setServerStatus("connected");
        return true;
      }
      setServerStatus("disconnected");
      return false;
    } catch {
      setServerStatus("disconnected");
      return false;
    }
  }, []);

  // Run health check on mount and every 30 seconds
  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 30_000);
    return () => clearInterval(interval);
  }, [checkServer]);

  // ── API helper ──────────────────────────────────────────────────────────────
  const api = useCallback(
    async (path, options = {}) => {
      const isMutation = options.method && options.method.toUpperCase() !== "GET";
      if (isMutation) setLoading(true);
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      };
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);
        const res = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers,
          signal: controller.signal,
          body:
            options.body && typeof options.body !== "string"
              ? JSON.stringify(options.body)
              : options.body,
        });
        clearTimeout(timeout);
        setServerStatus("connected");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Request failed");
        return data;
      } catch (err) {
        if (err.name === "AbortError") {
          setServerStatus("disconnected");
          throw new Error(
            `Cannot reach server at ${API_BASE}. ` +
              (Platform.OS === "android"
                ? "If using a physical device, set EXPO_PUBLIC_API_URL to your PC's LAN IP."
                : "Make sure the server is running.")
          );
        }
        // Network failure
        if (!err.message?.includes("Request failed")) {
          setServerStatus("disconnected");
        }
        throw err;
      } finally {
        if (isMutation) setLoading(false);
      }
    },
    [token]
  );

  // ── Token persistence ───────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY)
      .then((saved) => {
        if (saved) setToken(saved);
      })
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (booting) return;
    if (token) AsyncStorage.setItem(TOKEN_KEY, token);
    else AsyncStorage.removeItem(TOKEN_KEY);
  }, [token, booting]);

  // ── Push notification registration ──────────────────────────────────────────
  useEffect(() => {
    if (!token || booting || !user) return;
    registerForPushNotifications(token, API_BASE);

    if (user.role === "donor") {
      (async () => {
        try {
          const { status } = await Notifications.requestPermissionsAsync({
            ios: { allowCriticalAlerts: true },
          });
          if (status === "granted") {
            const fcmToken = await Notifications.getDevicePushTokenAsync();
            if (fcmToken?.data) {
              await fetch(`${API_BASE}/donors/device-token`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ token: fcmToken.data }),
              });
              console.log("[FCM] Device token registered with backend successfully");
            }
          }
        } catch (err) {
          console.warn("[FCM] Device token registration failed:", err.message);
        }
      })();
    }
  }, [token, booting, user]);

  // ── Handle notification taps → deep-link to correct screen ────────────────
  useEffect(() => {
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.screen) {
          setRoute(data.screen);
        }
      });

    return () => {
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
    };
  }, []);

  // ── Fetch current user ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || booting) return undefined;
    let active = true;
    (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        setServerStatus("connected");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Session expired");
        if (!active) return;
        setUser(data.data);
        setRoute((current) =>
          current === "home" || current === "login"
            ? `${data.data.role}:dashboard`
            : current
        );
      } catch (err) {
        if (!active) return;
        if (err.name === "AbortError" || err.message?.toLowerCase().includes("network")) {
          setServerStatus("disconnected");
          // Don't log out on network error — keep token, just show banner
          return;
        }
        setToken("");
        setUser(null);
        setRoute("home");
      }
    })();
    return () => {
      active = false;
    };
  }, [token, booting]);

  // ── Socket setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return undefined;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      setServerStatus("connected");
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("connect_error", (err) => {
      setSocketConnected(false);
      setServerStatus("disconnected");
      console.warn("[Socket] connect_error:", err.message);
    });

    const clearSosAlertTimer = () => {
      if (sosAlertTimer.current) {
        clearTimeout(sosAlertTimer.current);
        sosAlertTimer.current = null;
      }
    };

    socket.on("blood-request:new", (notification) => {
      const isCritical = notification?.data?.urgency === "critical";

      if (user?.role === "donor" && !notification?.data?.closed) {
        if (isCritical) {
          setSosAlarmData(notification);
          setSosAlarmVisible(true);
        } else {
          clearSosAlertTimer();
          setActiveSos(notification);
          sosAlertTimer.current = setTimeout(() => {
            clearSosAlertTimer();
            setActiveSos((current) =>
              String(current?.data?.requestId) ===
              String(notification?.data?.requestId)
                ? null
                : current
            );
          }, SOS_ALERT_DURATION_MS);
        }
      }
      // SOS alerts use the custom full-screen alarm modal, bypass standard popup
      if (!isCritical) {
        Alert.alert(
          "Blood request",
          notification?.message || "A nearby request needs help."
        );
      }
    });

    socket.on("blood-request:closed", (payload = {}) => {
      setSosAlarmData((current) => {
        const currentId = current?.data?.requestId || current?.requestId;
        if (String(currentId) === String(payload.requestId)) {
          setSosAlarmVisible(false);
          return null;
        }
        return current;
      });

      clearSosAlertTimer();
      setActiveSos((current) =>
        String(current?.data?.requestId) === String(payload.requestId)
          ? null
          : current
      );
      Alert.alert(
        "Request covered",
        payload.message || "Another donor accepted this request."
      );
    });

    socket.on("blood-request:response", (notification = {}) => {
      Alert.alert(
        "Donor response",
        notification.message || "A donor responded to your request."
      );
    });

    socket.on("chat:ready", ({ requestId } = {}) => {
      Alert.alert("Chat ready", "Open the request chat now?", [
        { text: "Later" },
        { text: "Open", onPress: () => setRoute(`chat:${requestId}`) },
      ]);
    });

    socket.on("donation:recorded", (payload = {}) => {
      const badgeText = payload.badges?.length
        ? `\nBadges: ${payload.badges.join(", ")}`
        : "";
      Alert.alert(
        "Donation recorded",
        `+${payload.pointsAwarded || 0} points earned. Total donations: ${payload.totalDonations || 0}.${badgeText}`
      );
      setDonationTick((tick) => tick + 1);
      setEligibilityTick((tick) => tick + 1);
    });

    socket.on("eligibility:deferred", () => {
      Alert.alert(
        "Eligibility updated",
        "You are deferred for 30 days after donation."
      );
      setEligibilityTick((tick) => tick + 1);
    });

    return () => {
      clearSosAlertTimer();
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [token, user?.role]);

  // ── Alarm Vibration & Sound Loop ─────────────────────────────────────────────
  const soundRef = useRef(null);

  useEffect(() => {
    const isCritical = activeSos && activeSos.data?.urgency === "critical";

    if (isCritical) {
      // 1. Loop alarm vibration
      Vibration.vibrate([1000, 800, 1000, 800], true);

      // 2. Loop alarm sound
      let soundInstance = null;
      (async () => {
        try {
          const { Audio } = require("expo-av");
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldRouteThroughEarpieceAndroid: false,
          });

          const { sound } = await Audio.Sound.createAsync(
            { uri: "https://assets.mixkit.co/active_storage/sfx/951/951-84.wav" },
            { shouldPlay: true, isLooping: true, volume: 1.0 }
          );
          soundInstance = sound;
          soundRef.current = sound;
        } catch (err) {
          console.warn("[Alarm Sound] Error:", err.message);
        }
      })();
    }

    return () => {
      Vibration.cancel();
      if (soundRef.current) {
        const soundToStop = soundRef.current;
        soundRef.current = null;
        soundToStop.stopAsync()
          .then(() => soundToStop.unloadAsync())
          .catch((err) => console.log("[Alarm Clean] Error:", err.message));
      }
    };
  }, [activeSos]);

  // ── Auth actions ─────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(data.token);
      setUser(data.user);
      setRoute(`${data.user.role}:dashboard`);
    } catch (err) {
      Alert.alert("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const data = await api("/auth/signup", { method: "POST", body: payload });
      setToken(data.token);
      setUser(data.user);
      setRoute(`${data.user.role}:dashboard`);
    } catch (err) {
      Alert.alert("Register failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await unregisterPushToken(token);
    setToken("");
    setUser(null);
    setRoute("home");
    await AsyncStorage.removeItem(TOKEN_KEY);
  };

  const respondToSos = async (action) => {
    const requestId = activeSos?.data?.requestId;
    if (!requestId) return;
    if (sosAlertTimer.current) {
      clearTimeout(sosAlertTimer.current);
      sosAlertTimer.current = null;
    }
    try {
      const data = await api(`/blood-requests/${requestId}/respond`, {
        method: "PUT",
        body: { action },
      });
      setActiveSos(null);
      if (action === "accept") {
        setRoute(`chat:${data?.data?.request?._id || requestId}`);
      }
      Alert.alert(
        "Saved",
        action === "accept"
          ? "Request accepted. Opening chat."
          : "Response saved."
      );
    } catch (err) {
      Alert.alert("Response failed", err.message);
      if (String(err.message).includes("already been accepted"))
        setActiveSos(null);
    }
  };

  const updateLocation = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted")
        throw new Error("Location permission denied");
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const data = await api("/donors/location", {
        method: "PUT",
        body: { lat: position.coords.latitude, lng: position.coords.longitude },
      });
      setUser(data.data);
      Alert.alert("Location updated");
    } catch (err) {
      Alert.alert("Location failed", err.message);
    }
  };

  // ── Context value ─────────────────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      api,
      user,
      setUser,
      route,
      setRoute,
      socket: socketRef.current,
      login,
      register,
      logout,
      respondToSos,
      updateLocation,
      checkServer,
      eligibilityTick,
      donationTick,
      loading,
      setLoading,
      booting,
      activeSos,
      setActiveSos,
      serverStatus,
      socketConnected,
      apiBase: API_BASE,
      goBack,
      canGoBack,
      sageMode,
      toggleSageMode,
      sosAlarmVisible,
      setSosAlarmVisible,
      sosAlarmData,
      setSosAlarmData,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api, user, route, eligibilityTick, donationTick, loading, booting, activeSos, serverStatus, socketConnected, goBack, canGoBack, sageMode, toggleSageMode, sosAlarmVisible, sosAlarmData]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
