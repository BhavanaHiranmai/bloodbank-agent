import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";

TaskManager.defineTask("SOS_BACKGROUND_HANDLER", async ({ data, error }) => {
  if (error) {
    console.error("[sosTask] Background task error:", error);
    return;
  }

  const notificationObj = data?.notification;
  const payload = notificationObj?.request?.content?.data || data?.data || data;

  if (payload && payload.type === "sos_alert") {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚨 BLOOD NEEDED URGENTLY",
          body: `${payload.bloodGroup || ""} blood needed nearby`,
          categoryIdentifier: "sos_response",
          sound: "sos_alarm.mp3",
          sticky: true,
          data: payload,
          android: {
            channelId: "sos_channel",
            fullScreenIntent: true,
            sticky: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
        },
        trigger: null,
      });
    } catch (err) {
      console.error("[sosTask] Error scheduling notification:", err);
    }
  }
});
