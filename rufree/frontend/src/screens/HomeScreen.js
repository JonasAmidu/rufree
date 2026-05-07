import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { fetchActivities } from '../utils/activityFeed';

const formatDate = (value) => {
  if (!value) {
    return 'Not specified';
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().toLocaleString();
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  return 'Not specified';
};

const HomeScreen = ({ userProfile }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setPosts(await fetchActivities(db));
      } catch (error) {
        console.error('Error fetching posts:', error);
        Alert.alert('Error', 'Failed to load activities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleJoinActivity = (postId) => {
    Alert.alert('Joining Activity', `You expressed interest in activity ID: ${postId}`);
  };

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error', error);
      Alert.alert('Sign out failed', error.message || 'Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>RuFree</Text>
          <Text style={styles.headerSubtitle}>Your Real-Time Activity Finder</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} disabled={signingOut}>
          <Text style={styles.signOutButtonText}>{signingOut ? 'Signing out...' : 'Sign out'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        {userProfile?.photoUrl ? (
          <Image source={{ uri: userProfile.photoUrl }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImage, styles.profileImageFallback]}>
            <Text style={styles.profileInitial}>
              {(userProfile?.displayName || 'R').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.profileBody}>
          <Text style={styles.profileName}>{userProfile?.displayName || 'RuFree User'}</Text>
          <Text style={styles.profileBio}>
            {userProfile?.bio || 'Add your profile details so people know what you are up for.'}
          </Text>
          <View style={styles.interestRow}>
            {(userProfile?.favoriteActivities || []).map((activity) => (
              <View key={activity} style={styles.interestChip}>
                <Text style={styles.interestChipText}>{activity}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {posts.length === 0 ? (
          <Text style={styles.noPostsText}>No activities found. Be the first to create one!</Text>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={[styles.postCard, post.isUrgent && styles.urgentPost]}>
              <View style={styles.postContent}>
                <Text style={[styles.activityText, post.isUrgent && styles.urgentActivityText]}>
                  {post.activity || 'Untitled activity'}
                </Text>
                <Text style={styles.details}>
                  <Text style={styles.detailLabel}>When:</Text> {formatDate(post.startTime)}
                </Text>
                <Text style={styles.details}>
                  <Text style={styles.detailLabel}>At:</Text> {post.location?.name || 'Not specified'}
                </Text>
                <Text style={styles.details}>
                  <Text style={styles.detailLabel}>By:</Text> {post.creatorName || 'Anonymous'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.joinButton, post.isUrgent && styles.urgentJoinButton]}
                onPress={() => handleJoinActivity(post.id)}
              >
                <Text style={styles.joinButtonText}>I'm Free!</Text>
              </TouchableOpacity>
              <Text style={styles.interestedCount}>
                {Array.isArray(post.interestedUsers) ? post.interestedUsers.length : 0} people interested
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0E0',
    paddingTop: 50
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 14
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF0E0'
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 5
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F1D5BF'
  },
  signOutButtonText: {
    color: '#7B5A44',
    fontWeight: '700'
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 15,
    marginBottom: 18,
    padding: 16,
    flexDirection: 'row'
  },
  profileImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F5D5B8'
  },
  profileImageFallback: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileInitial: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B'
  },
  profileBody: {
    flex: 1,
    marginLeft: 14
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6
  },
  profileBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10
  },
  interestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  interestChip: {
    backgroundColor: '#FFF0E0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8
  },
  interestChipText: {
    color: '#7B5A44',
    fontWeight: '600',
    fontSize: 12
  },
  scrollView: {
    flex: 1
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  urgentPost: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
    backgroundColor: '#FFF8F8'
  },
  postContent: {
    marginBottom: 15
  },
  activityText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  urgentActivityText: {
    color: '#FF6B6B'
  },
  details: {
    fontSize: 15,
    color: '#555',
    marginBottom: 5
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#333'
  },
  joinButton: {
    backgroundColor: '#FFC048',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10
  },
  urgentJoinButton: {
    backgroundColor: '#FF6B6B'
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  interestedCount: {
    fontSize: 13,
    color: '#888',
    textAlign: 'right'
  },
  noPostsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888'
  }
});

export default HomeScreen;
