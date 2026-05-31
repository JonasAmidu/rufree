import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Image
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@firebase/auth';
import { doc, serverTimestamp, setDoc } from '@firebase/firestore';
import AppBackground from '../components/AppBackground';
import { auth, db } from '../firebase/config';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseErrorMessage';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !displayName.trim())) {
      Alert.alert('Missing info', 'Please complete all required fields.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        Alert.alert('Success', 'Logged in successfully.');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: email.trim(),
          displayName: displayName.trim(),
          createdAt: serverTimestamp()
        });

        Alert.alert('Success', 'Account created successfully.');
      }
    } catch (error) {
      console.error('Authentication Error', error);
      Alert.alert('Authentication Error', getFirebaseAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Image
          source={require('../../assets/RuFREE_logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <Text style={styles.title}>RuFree</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Login to find activities' : 'Sign up for RuFree'}
        </Text>

        {!isLogin && (
          <TextInput
            testID="display-name-input"
            style={styles.input}
            placeholder="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            placeholderTextColor="#999"
          />
        )}

        <TextInput
          testID="email-input"
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />

        <TextInput
          testID="password-input"
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          testID="auth-submit-button"
          style={styles.button}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="auth-toggle-button"
          style={styles.toggleButton}
          onPress={() => {
            setIsLogin(!isLogin);
            setEmail('');
            setPassword('');
            setDisplayName('');
          }}
          disabled={loading}
        >
          <Text style={styles.toggleButtonText}>
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    overflow: 'hidden'
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FF6B6B'
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 30
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 16
  },
  button: {
    backgroundColor: '#FF6B6B',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  toggleButton: {
    marginTop: 20
  },
  toggleButtonText: {
    color: '#555',
    fontSize: 16
  }
});

export default AuthScreen;
