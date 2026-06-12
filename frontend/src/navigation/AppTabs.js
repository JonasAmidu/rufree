import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { sendPasswordResetEmail, signOut } from '@firebase/auth';
import { collection, limit, onSnapshot, orderBy, query, where } from '@firebase/firestore';
import { auth, db } from '../firebase/config';
import HomeScreen from '../screens/HomeScreen';
import CreateActivityScreen from '../screens/CreateActivityScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MessagesScreen, { buildThreadsFromActivities, buildThreadsFromConversations } from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { calculateDistanceKm } from '../utils/activityFeed';
import { buildMessagesQuery, sendConversationMessage } from '../utils/messaging';

const Tab = createBottomTabNavigator();
const PROFILE_RADIUS_KM = 10;

const TAB_ICONS = {
  Home: ['home-outline', 'home'],
  Activity: ['add-circle-outline', 'add-circle'],
  Messages: ['chatbubble-ellipses-outline', 'chatbubble-ellipses'],
  Profile: ['person-circle-outline', 'person-circle'],
  Settings: ['settings-outline', 'settings']
};

const AppTabs = ({ user, userProfile }) => {
  const [activities, setActivities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const unsubscribeActivities = onSnapshot(
      query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50)),
      (snapshot) => {
        setActivities(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }))
        );
      },
      (error) => {
        console.error('Tab activity subscription error', error);
      }
    );

    const unsubscribeUsers = onSnapshot(
      query(collection(db, 'users'), limit(100)),
      (snapshot) => {
        setAllUsers(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }))
        );
      },
      (error) => {
        console.error('Tab user subscription error', error);
      }
    );

    const unsubscribeConversations = onSnapshot(
      query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', user.uid),
        orderBy('lastMessageAt', 'desc'),
        limit(50)
      ),
      (snapshot) => {
        setConversations(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }))
        );
      },
      (error) => {
        console.error('Conversation subscription error', error);
      }
    );

    return () => {
      unsubscribeActivities();
      unsubscribeUsers();
      unsubscribeConversations();
    };
  }, [user.uid]);

  useEffect(() => {
    if (!activeThread?.conversationId) {
      setActiveMessages([]);
      return undefined;
    }

    return onSnapshot(
      buildMessagesQuery(db, activeThread.conversationId),
      (snapshot) => {
        setActiveMessages(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }))
        );
      },
      (error) => {
        console.error('Message subscription error', error);
        Alert.alert('Messages unavailable', 'We could not load this conversation right now.');
      }
    );
  }, [activeThread?.conversationId]);

  const nearbyCount = useMemo(() => {
    if (!userProfile?.location) {
      return 0;
    }

    return allUsers.filter((person) => {
      if (!person?.uid || person.uid === user.uid) {
        return false;
      }

      const distanceKm = calculateDistanceKm(userProfile.location, person.location);
      return typeof distanceKm === 'number' && distanceKm <= PROFILE_RADIUS_KM;
    }).length;
  }, [allUsers, user.uid, userProfile?.location]);

  const messageThreads = useMemo(
    () => {
      const persistedThreads = buildThreadsFromConversations(conversations, user);
      return persistedThreads.length ? persistedThreads : buildThreadsFromActivities(activities, user);
    },
    [activities, conversations, user]
  );

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Profile tab sign out error', error);
      Alert.alert('Sign out failed', error.message || 'Please try again.');
      setSigningOut(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) {
      Alert.alert('Email unavailable', 'Sign in again before requesting a password reset.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert('Reset email sent', 'Check your inbox for the Firebase password reset link.');
    } catch (error) {
      console.error('Password reset error', error);
      Alert.alert('Reset failed', error.message || 'Please try again.');
    }
  };

  const showPolicyNotice = (title) => {
    Alert.alert(title, 'Release policy copy is tracked in the RuFree release board and must be approved before public launch.');
  };

  const handleOpenThread = (thread) => {
    if (!thread?.conversationId) {
      Alert.alert(
        thread?.name || 'Conversation',
        'Join a live activity to create the plan chat, then messages will appear here.'
      );
      return;
    }

    setActiveThread(thread);
    setMessageDraft('');
  };

  const handleSendMessage = async () => {
    if (!activeThread?.conversationId) {
      return;
    }

    setSendingMessage(true);

    try {
      await sendConversationMessage(db, activeThread.conversationId, {
        text: messageDraft,
        user,
        userProfile
      });
      setMessageDraft('');
    } catch (error) {
      console.error('Send message error', error);
      Alert.alert('Message failed', error.message || 'Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#17D6C5',
          tabBarInactiveTintColor: '#7A8B95',
          tabBarStyle: {
            backgroundColor: '#08161D',
            borderTopColor: '#14313C',
            height: 74,
            paddingBottom: 10,
            paddingTop: 10
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '700'
          },
          tabBarIcon: ({ color, focused, size }) => {
            const [outlineName, filledName] = TAB_ICONS[route.name];
            return (
              <Ionicons
                color={color}
                name={focused ? filledName : outlineName}
                size={size}
              />
            );
          }
        })}
      >
        <Tab.Screen name="Home">
          {() => <HomeScreen user={user} userProfile={userProfile} />}
        </Tab.Screen>
        <Tab.Screen
          name="Activity"
          options={{
            tabBarLabel: 'Add Activity'
          }}
        >
          {() => (
            <CreateActivityScreen
              creatorProfile={userProfile}
              currentLocation={userProfile?.location || null}
              user={user}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Messages">
          {({ navigation }) => (
            <MessagesScreen
              onFindPeople={() => navigation.navigate('Home')}
              onOpenThread={handleOpenThread}
              threads={messageThreads}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Profile">
          {() => (
            <ProfileScreen
              activities={activities}
              nearbyCount={nearbyCount}
              onEditProfile={() => setShowEditProfileModal(true)}
              onSignOut={handleSignOut}
              signingOut={signingOut}
              user={user}
              userProfile={userProfile}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Settings">
          {() => (
            <SettingsScreen
              onAbout={() => Alert.alert('About RuFree', 'RuFree helps nearby people turn free time into real plans.')}
              onContactUs={() => Alert.alert('Contact RuFree', 'Support contact details are pending final release copy.')}
              onHelp={() => Alert.alert('Help', 'Use reports, blocks, and sign out if something feels wrong.')}
              onLogout={handleSignOut}
              onPrivacyPolicy={() => showPolicyNotice('Privacy Policy')}
              onResetPassword={handleResetPassword}
              onTerms={() => showPolicyNotice('Terms & Conditions')}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>

      <Modal animationType="slide" visible={showEditProfileModal}>
        <EditProfileScreen
          initialProfile={userProfile}
          onCancel={() => setShowEditProfileModal(false)}
          onProfileSaved={() => setShowEditProfileModal(false)}
          user={user}
        />
      </Modal>

      <Modal animationType="slide" visible={Boolean(activeThread)}>
        <View style={styles.threadScreen}>
          <View style={styles.threadHeader}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setActiveThread(null)}
              style={styles.closeButton}
            >
              <Ionicons color="#0B2C34" name="chevron-back" size={24} />
            </TouchableOpacity>
            <View style={styles.threadTitleWrap}>
              <Text numberOfLines={1} style={styles.threadTitle}>
                {activeThread?.name || 'Conversation'}
              </Text>
              <Text numberOfLines={1} style={styles.threadSubtitle}>
                {activeThread?.activity || 'RuFree plan'}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.messageList}>
            {activeMessages.length ? (
              activeMessages.map((message) => {
                const mine = message.senderId === user.uid;

                return (
                  <View
                    key={message.id}
                    style={[styles.messageBubble, mine && styles.messageBubbleMine]}
                  >
                    <Text style={[styles.messageSender, mine && styles.messageSenderMine]}>
                      {mine ? 'You' : message.senderName || 'RuFree user'}
                    </Text>
                    <Text style={[styles.messageText, mine && styles.messageTextMine]}>
                      {message.text}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyThread}>
                <Text style={styles.emptyThreadTitle}>No messages yet</Text>
                <Text style={styles.emptyThreadBody}>
                  Send the first note to confirm where and when to meet.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              multiline
              onChangeText={setMessageDraft}
              placeholder="Message this plan"
              placeholderTextColor="#6F838C"
              style={styles.messageInput}
              value={messageDraft}
            />
            <TouchableOpacity
              accessibilityRole="button"
              disabled={sendingMessage || !messageDraft.trim()}
              onPress={handleSendMessage}
              style={[
                styles.sendButton,
                (sendingMessage || !messageDraft.trim()) && styles.sendButtonDisabled
              ]}
            >
              <Ionicons color="#FFFFFF" name="send" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  threadScreen: {
    backgroundColor: '#F5FBFC',
    flex: 1
  },
  threadHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#DCE8ED',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 52
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#EAF7F5',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  threadTitleWrap: {
    flex: 1
  },
  threadTitle: {
    color: '#103141',
    fontSize: 20,
    fontWeight: '900'
  },
  threadSubtitle: {
    color: '#5F747D',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2
  },
  messageList: {
    flexGrow: 1,
    gap: 10,
    justifyContent: 'flex-end',
    padding: 16
  },
  messageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE8ED',
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: '86%',
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  messageBubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#0CA999',
    borderColor: '#0CA999'
  },
  messageSender: {
    color: '#607681',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4
  },
  messageSenderMine: {
    color: '#DDFCF7'
  },
  messageText: {
    color: '#14364B',
    fontSize: 15,
    lineHeight: 21
  },
  messageTextMine: {
    color: '#FFFFFF'
  },
  emptyThread: {
    alignItems: 'center',
    alignSelf: 'center',
    padding: 24
  },
  emptyThreadTitle: {
    color: '#123247',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8
  },
  emptyThreadBody: {
    color: '#5A707B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderTopColor: '#DCE8ED',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 14
  },
  messageInput: {
    backgroundColor: '#EFF7F8',
    borderRadius: 18,
    color: '#103141',
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#0CA999',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  sendButtonDisabled: {
    backgroundColor: '#9DB2BA'
  }
});

export default AppTabs;
