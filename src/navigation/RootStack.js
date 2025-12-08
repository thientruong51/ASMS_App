// RootStack.js (cập nhật)
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/home/HomeScreen";
import SettingsScreen from "../screens/SettingsScreen";

import ContainersScreen from "../screens/containers/ContainersScreen";
import OrderDetailScreen from "../screens/orders/OrderDetailScreen";

import SplashScreen from "../screens/auth/SplashScreen";
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import OTPVerificationScreen from "../screens/auth/OTPVerificationScreen";

// <-- thêm import cho Profile / EditProfile
import ProfileScreen from "../screens/profile/ProfileScreen";     // đường dẫn điều chỉnh theo project
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import NotificationScreen from "../screens/notification/NotificationScreen";

const Stack = createNativeStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* Auth flow */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />

      {/* App flow */}
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Containers"
        component={ContainersScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: false }}
      />

    
      <Stack.Screen
        name="Account"              
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfileScreen"     
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />

       <Stack.Screen
        name="Notifications"              
        component={NotificationScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
