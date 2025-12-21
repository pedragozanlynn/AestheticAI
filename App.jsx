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

import EarningsScreen from "./app/Consultant/EarningsScreen";
import Homepage from "./app/Consultant/Homepage";
import Requests from "./app/Consultant/Requests";

// 🏠 User Main Screens
import AIDesigner from "./app/User/AIDesigner";
import Consultants from "./app/User/Consultants";
import Home from "./app/User/Home";
import Profile from "./app/User/Profile";
import Projects from "./app/User/Projects";

// ⭐ Premium Upgrade Screens (NEW)
import UpgradeInfo from "./app/User/UpgradeInfo";
import UpgradePayment from "./app/User/UpgradePayment";

// 🛡 Admin Screen
import ConsultantDetails from "./app/Admin/ConsultantDetails";
import Dashboard from "./app/Admin/Dashboard";
import Ratings from "./app/Admin/Ratings";
import Subscription from "./app/Admin/Subscription";
import Withdrawals from "./app/Admin/Withdrawals";


const Stack = createNativeStackNavigator();

export default function App() {
  return (
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
        <Stack.Screen name="EarningsScreen" component={EarningsScreen} />


        {/* 🏠 User App */}
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="AIDesigner" component={AIDesigner} />
        <Stack.Screen name="Consultants" component={Consultants} />
        <Stack.Screen name="Projects" component={Projects} />
        <Stack.Screen name="Profile" component={Profile} />

        {/* ⭐ Premium Upgrade Routes */}
        <Stack.Screen name="UpgradeInfo" component={UpgradeInfo} />
        <Stack.Screen name="UpgradePayment" component={UpgradePayment} />

        {/* 🛡 Admin Dashboard */}
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Consultants" component={Consultants} />
        <Stack.Screen name="ConsultantDetails" component={ConsultantDetails} />
        <Stack.Screen name="Subscription" component={Subscription} />
        <Stack.Screen name="Ratings" component={Ratings} />
        <Stack.Screen name="Withdrawals" component={Withdrawals} />


    

      </Stack.Navigator>

  );
}
