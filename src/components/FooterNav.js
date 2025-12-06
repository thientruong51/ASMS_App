import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function FooterNav({ navigation, active = 'Dashboard', onNavigate }) {
  const items = [
    { key: 'Home', label: 'Home', icon: 'home' },
    { key: 'Containers', label: 'Containers', icon: 'package-variant-closed' },
    { key: 'Account', label: 'Tài khoản', icon: 'account' },
    { key: 'Notifications', label: 'Thông báo', icon: 'bell' },
  ];

  function goTo(key) {
    if (onNavigate) return onNavigate(key);
    if (navigation && navigation.navigate) return navigation.navigate(key);
  }

  return (
    <View style={styles.container}>
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <TouchableOpacity
            key={it.key}
            style={styles.item}
            onPress={() => goTo(it.key)}
            activeOpacity={0.7}
          >
            <Icon
              name={it.icon}
              size={26}
              color={isActive ? '#108a3f' : '#777'}
            />
            <Text style={isActive ? styles.labelActive : styles.labelInactive}>{it.label}</Text>
            <View style={isActive ? styles.activeBar : styles.placeholderBar} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const FOOTER_HEIGHT = 78;

const styles = StyleSheet.create({
  container: {
    height: FOOTER_HEIGHT,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
    paddingBottom: Platform.OS === 'ios' ? 12 : 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  labelActive: { fontSize: 12, color: '#108a3f', fontWeight: '700', marginTop: 4 },
  labelInactive: { fontSize: 12, color: '#777', marginTop: 4 },
  activeBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 8 : 3,
    height: 4,
    width: 36,
    backgroundColor: '#108a3f',
    borderRadius: 4,
  },
  placeholderBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 8 : 6,
    height: 4,
    width: 36,
    backgroundColor: 'transparent',
  },
});
