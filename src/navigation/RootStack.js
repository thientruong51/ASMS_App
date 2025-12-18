import { createNativeStackNavigator } from "@react-navigation/native-stack";

// App screens
import HomeScreen from "../screens/home/HomeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ContainersScreen from "../screens/containers/ContainersScreen";
import OrderDetailScreen from "../screens/orders/OrderDetailScreen";
import NotificationScreen from "../screens/notification/NotificationScreen";

// Auth screens
import SplashScreen from "../screens/auth/SplashScreen";
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import OTPVerificationScreen from "../screens/auth/OTPVerificationScreen";

// Profile
import ProfileScreen from "../screens/profile/ProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";

const Stack = createNativeStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      {/* ===== AUTH FLOW ===== */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen
        name="OTPVerification"
        component={OTPVerificationScreen}
      />

      {/* ===== APP FLOW ===== */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Containers" component={ContainersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />

      <Stack.Screen name="Account" component={ProfileScreen} />
      <Stack.Screen
        name="EditProfileScreen"
        component={EditProfileScreen}
      />

      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
