import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import "./polyfills";


// 🧩 User Screens
import ForgotPassword from "./app/ForgotPassword";
import Login from "./app/Login";
import Register from "./app/User/Register";

// 🧠 Consultant Registration Steps
import Step1Register from "./app/Consultant/Step1Register";
import Step2Details from "./app/Consultant/Step2Details";
import Step3Review from "./app/Consultant/Step3Review";

import Homepage from "./app/Consultant/Homepage";
import Requests from "./app/Consultant/Requests";


// 🏠 User Main Screens
import AIDesigner from "./app/User/AIDesigner";
import Consultation from "./app/User/Consultation";
import Home from "./app/User/Home";
import Profile from "./app/User/Profile";
import Projects from "./app/User/Projects";

// 🛡 Admin Screen
import ConsultantDetails from "./app/Admin/ConsultantDetails"; // ⬅️ ADD THIS
import Consultants from "./app/Admin/Consultants"; // ⬅️ ADD THIS
import Dashboard from "./app/Admin/Dashboard";


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
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
        
        <Stack.Screen name="Homepage" component={Homepage} />
        <Stack.Screen name="Requests" component={Requests} />

        {/* 🏠 User App */}
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="AIDesigner" component={AIDesigner} />
        <Stack.Screen name="Consultation" component={Consultation} />
        <Stack.Screen name="Projects" component={Projects} />
        <Stack.Screen name="Profile" component={Profile} />

        {/* 🛡 Admin Dashboard */}
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Consultants" component={Consultants} />
        <Stack.Screen name="ConsultantDetails" component={ConsultantDetails} />


      </Stack.Navigator>
    </NavigationContainer>
  );
}
