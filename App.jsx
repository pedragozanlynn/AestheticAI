import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// 🧩 User Screens
import Login from "./app/Login";
import ForgotPassword from "./app/ForgotPassword";
import Register from "./app/User/Register";

// 🧠 Consultant Registration Steps
import Step1Register from "./app/consultants/Step1Register";
import Step2Details from "./app/consultants/Step2Details";
import Step3Review from "./app/consultants/Step3Review";

// 🏠 Main App Navigation
import BottomNav from "./app/components/BottomNav";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right", // smoother transitions
        }}
      >
        {/* 👥 User Screens */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="Register" component={Register} />

        {/* 👨‍💼 Consultant Registration Steps */}
        <Stack.Screen name="Step1Register" component={Step1Register} />
        <Stack.Screen name="Step2Details" component={Step2Details} />
        <Stack.Screen name="Step3Review" component={Step3Review} />

        {/* 🏠 Main App */}
        <Stack.Screen name="Home" component={BottomNav} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
