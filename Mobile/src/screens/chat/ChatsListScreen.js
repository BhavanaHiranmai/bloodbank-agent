import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Shell } from "../../components/common/Shell";
import { Card } from "../../components/common/Card";
import { List } from "../../components/common/List";
import { BloodGroupPill } from "../../components/common/BloodGroupPill";
import { Button } from "../../components/common/Button";
import { useAppContext } from "../../context/AppContext";
import { useLoader } from "../../utils/useLoader";
import { theme } from "../../styles/theme";

export function ChatsListScreen({ tabs }) {
  const ctx = useAppContext();
  const [conversations, setConversations] = useState([]);

  const load = async () => {
    const res = await ctx.api("/chats");
    setConversations(res.data || []);
  };

  const loading = useLoader(ctx, load, []);

  return (
    <Shell title="My Chats" tabs={tabs} loading={loading}>
      <List
        data={conversations}
        empty="No active chats yet. Accepted blood requests will appear here."
        renderItem={(item) => {
          const requesterId = item.requester?._id || item.requester;
          const isRequester = String(requesterId) === String(ctx.user?._id);
          const other = isRequester ? item.donor : item.requester;
          const lastMessage = item.messages?.[item.messages.length - 1];
          const requestId = item.request?._id || item.request;

          const name = other?.hospitalName || `${other?.firstName || ""} ${other?.lastName || ""}`.trim() || "BloodLink User";
          const lastMsgText = lastMessage?.message || `${item.request?.unitsNeeded || 1} unit(s) requested`;

          return (
            <Card style={styles.card}>
              <View style={styles.header}>
                <BloodGroupPill group={item.request?.bloodGroup} />
                <View style={[styles.statusBadge, item.request?.status === "responding" ? styles.statusActive : styles.statusClosed]}>
                  <Text style={styles.statusText}>{item.request?.status || "open"}</Text>
                </View>
              </View>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.message} numberOfLines={1}>{lastMsgText}</Text>
              <Button
                label="Open Chat"
                onPress={() => ctx.setRoute(`chat:${requestId}`)}
                style={styles.btn}
              />
            </Card>
          );
        }}
      />
    </Shell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusActive: {
    backgroundColor: theme.colors.successBg,
  },
  statusClosed: {
    backgroundColor: theme.colors.infoBg,
  },
  statusText: {
    ...theme.type.small,
    fontSize: 11,
    color: theme.colors.textSub,
    textTransform: "uppercase",
  },
  name: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: theme.colors.textSub,
    fontWeight: "600",
    marginBottom: 12,
  },
  btn: {
    marginTop: 0,
    minHeight: 40,
  },
});

export default ChatsListScreen;
