import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from "expo-router";
import { auth, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential } from '../../config/authConfig';
import GoogleButton from '../components/GoogleButton';
import PolicyModal from '../components/PolicyModal';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '873025464768-7e4buvv8sr3n7g8ovgr1d7hbpf4vm4ir.apps.googleusercontent.com',
    androidClientId: '873025464768-ipmmnlhtjj1erddf3jo708gpuehu5483.apps.googleusercontent.com',
    webClientId: '873025464768-7e4buvv8sr3n7g8ovgr1d7hbpf4vm4ir.apps.googleusercontent.com',
  });

  useEffect(() => {
    const signInWithGoogle = async () => {
      if (response?.type === 'success' && response.authentication?.idToken) {
        try {
          setLoading(true);
          const { idToken } = response.authentication;
          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, credential);
          router.replace('/screens/HomeScreen');
        } catch (e) {
          Alert.alert('Google Sign-In failed', e.message);
        } finally {
          setLoading(false);
        }
      }
    };
    signInWithGoogle();
  }, [response]);

  const onRegister = async () => {
    if (!agree) {
      Alert.alert('Agreement required', 'Please accept the Privacy & User Agreements to continue.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      router.replace('/screens/HomeScreen');
    } catch (e) {
      Alert.alert('Registration error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: '800' }}>Create your account</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Full name" style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }} />
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }} />
      <TextInput value={confirm} onChangeText={setConfirm} placeholder="Confirm password" secureTextEntry style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Switch value={agree} onValueChange={setAgree} />
        <Text>I agree to </Text>
        <TouchableOpacity onPress={() => setShowPolicy(true)}>
          <Text style={{ fontWeight: '700' }}>Privacy & Agreements</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onRegister} disabled={loading} style={{ backgroundColor: agree ? '#111827' : '#9CA3AF', padding: 14, borderRadius: 12, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>{loading ? 'Creating…' : 'Create account'}</Text>
      </TouchableOpacity>
      <GoogleButton onPress={() => promptAsync()} loading={loading || !request} />

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
        <Text>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/screens/LoginScreen")}>
          <Text style={{ fontWeight: "700" }}>Login</Text>
        </TouchableOpacity>
      </View>

      <PolicyModal visible={showPolicy} onClose={() => setShowPolicy(false)} onAccept={() => setAgree(true)} />
    </View>
  );
}
