import React from "react";
import { View, StyleSheet } from "react-native";
import { List, Switch } from "react-native-paper";

export default function SettingsScreen() {
  const [enabled, setEnabled] = React.useState(true);

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Item
          title="Thông báo"
          description="Bật hoặc tắt thông báo"
          right={() => <Switch value={enabled} onValueChange={() => setEnabled(!enabled)} />}
        />
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
