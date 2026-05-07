import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Switch
} from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, limit, where, getDocs, addDoc, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { fetchActivities, createActivity, likeActivity, unlikeActivity } from '../utils/activityFeed';

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

const HomeScreen = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [filterTrending, setFilterTrending] = useState(false);
  const [filterToday, setFilterToday] = useState(false);
  const [filterWeekend, setFilterWeekend] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All', 'Sports', 'Arts', 'Food', 'Learning', 'Social', 'Outdoor', 'Other']);
  const [userLikes, setUserLikes] = useState(new Set()); // Track which posts the user has liked

  // Enhanced fetch function with filtering
  const fetchPosts = async () => {
    try {
      let q = collection(db, 'posts');
      
      // Apply filters
      const conditions = [];
      
      if (filterTrending) {
        // For trending, we'll sort by likes (we'll implement this after fetching)
        // This is a simplified version - in production you might want to use Firebase queries better
      }
      
      if (filterToday) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        conditions.push(where('startTime', '>=', today));
      }
      
      if (filterWeekend) {
        const now = new Date();
        const day = now.getDay();
        const diffToSaturday = (day === 0) ? 1 : ((day === 6) ? 0 : 6 - day);
        const saturday = new Date(now);
        saturday.setDate(now.getDate() + diffToSaturday);
        saturday.setHours(0, 0, 0, 0);
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        conditions.push(where('startTime', '>=', saturday));
        conditions.push(where('startTime', '<', sunday));
      }
      
      // Apply category filter (if implemented in your data model)
      // if (selectedCategory !== 'All') {
      //   conditions.push(where('category', '==', selectedCategory));
      // }
      
      if (conditions.length > 0) {
        q = query(collection(db, 'posts'), ...conditions);
      }
      
      // Order by most recent first
      q = query(q, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const fetchedPosts = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedPosts.push({
          id: doc.id,
          ...data,
          // Ensure these fields exist
          interestedUsers: data.interestedUsers || [],
          likes: data.likes || 0,
          likedBy: data.likedBy || []
        });
      });
      
      // Sort by likes if trending filter is active
      if (filterTrending) {
        fetchedPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      }
      
      setPosts(fetchedPosts);
      
      // Track which posts the current user has liked
      const userLikesSet = new Set();
      fetchedPosts.forEach(post => {
        if (post.likedBy && Array.isArray(post.likedBy) && post.likedBy.includes(user.uid)) {
          userLikesSet.add(post.id);
        }
      });
      setUserLikes(userLikesSet);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load activities. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newActivity.trim() || !newLocation.trim() || !newDate.trim() || !newTime.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields to create an activity.');
      return;
    }

    try {
      const startTime = new Date(`${newDate} ${newTime}`);
      await createActivity(db, {
        activity: newActivity.trim(),
        location: { name: newLocation.trim() },
        startTime: startTime,
        isUrgent: isUrgent,
        createdAt: new Date(),
        creatorId: user.uid,
        creatorName: user.displayName || 'Anonymous'
      });
      
      // Reset form
      setNewActivity('');
      setNewLocation('');
      setNewDate('');
      setNewTime('');
      setIsUrgent(false);
      setShowCreatePostModal(false);
      
      // Refresh posts
      await fetchPosts();
      
      Alert.alert('Success', 'Your activity has been created!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create activity. Please try again.');
    }
  };

  const handleJoinActivity = async (postId) => {
    try {
      // In a real implementation, you'd update the interestedUsers array
      // For now, we'll just show a confirmation
      Alert.alert('Joining Activity', 'You\'ve expressed interest in this activity!');
    } catch (error) {
      console.error('Error joining activity:', error);
      Alert.alert('Error', 'Failed to join activity. Please try again.');
    }
  };

  const handleLikeActivity = async (postId) => {
    try {
      // Toggle like status
      if (userLikes.has(postId)) {
        await unlikeActivity(db, postId, user.uid);
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        await likeActivity(db, postId, user.uid);
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.add(postId);
          return newSet;
        });
      }
      
      // Update local state for immediate feedback
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likes: userLikes.has(postId) ? post.likes - 1 : post.likes + 1,
                likedBy: userLikes.has(postId) 
                  ? post.likedBy.filter(id => id !== user.uid) 
                  : [...post.likedBy, user.uid]
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking activity:', error);
      Alert.alert('Error', 'Failed to process like. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error', error);
      Alert.alert('Sign out failed', error.message || 'Please try again.');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filterTrending, filterToday, filterWeekend, selectedCategory]);

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>RuFeeds</Text>
          <Text style={styles.headerSubtitle}>Discover what's happening now</Text>
        </View>
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, filterTrending && styles.activeFilter]}
            onPress={() => setFilterTrending(!filterTrending)}
          >
            <Text style={styles.filterButtonText}>🔥 Trending</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filterToday && styles.activeFilter]}
            onPress={() => setFilterToday(!filterToday)}
          >
            <Text style={styles.filterButtonText}>📅 Today</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCreateButton = () => {
    return (
      <TouchableOpacity 
        style={styles.createButton} 
        onPress={() => setShowCreatePostModal(true)}
      >
        <View style={styles.createButtonContent}>
          <Text style={styles.createButtonText}>+</Text>
          <Text style={styles.createButtonLabel}>Create Activity</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        {!filterTrending && !filterToday && !filterWeekend ? (
          <View>
            <Text style={styles.emptyStateTitle}>No activities yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Be the first to create an activity and see who's free to join!
            </Text>
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={() => setShowCreatePostModal(true)}
            >
              <View style={styles.createButtonContent}>
                <Text style={styles.createButtonText}>+</Text>
                <Text style={styles.createButtonLabel}>Create First Activity</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.emptyStateTitle}>No activities match your filters</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try adjusting your filters or create a new activity!
            </Text>
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={() => setShowCreatePostModal(true)}
            >
              <View style={styles.createButtonContent}>
                <Text style={styles.createButtonText}>+</Text>
                <Text style={styles.createButtonLabel}>Create Activity</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderPostItem = ({ item }) => {
    const isLikedByUser = userLikes.has(item.id);
    
    return (
      <View key={item.id} style={[styles.postCard, item.isUrgent && styles.urgentPost]}>
        {/* Activity Header with urgency badge */}
        <View style={styles.postHeader}>
          <Text style={[styles.activityText, item.isUrgent && styles.urgentActivityText]}>
            {item.activity || 'Untitled activity'}
          </Text>
          {item.isUrgent && (
            <View style={styles.urgencyBadge}>
              <Text style={styles.urgencyBadgeText}>URGENT</Text>
            </View>
          )}
        </View>
        
        {/* Activity Details */}
        <View style={styles.postDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>When:</Text> {formatDate(item.startTime)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Where:</Text> {item.location?.name || 'Not specified'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👤</Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Host:</Text> {item.creatorName || 'Anonymous'}
            </Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionButtonGroup}>
            {/* Join Button */}
            <TouchableOpacity 
              style={[styles.joinButton, item.isUrgent && styles.urgentJoinButton]}
              onPress={() => handleJoinActivity(item.id)}
            >
              <Text style={styles.joinButtonText}>I'm Free!</Text>
            </TouchableOpacity>
            
            {/* Like Button */}
            <TouchableOpacity 
              style={[styles.likeButton, isLikedByUser && styles.likedButton]}
              onPress={() => handleLikeActivity(item.id)}
            >
              <View style={styles.likeButtonContent}>
                {isLikedByUser ? (
                  <Text style={styles.likedText}>❤️</Text>
                ) : (
                  <Text style={styles.likeText}>♡</Text>
                )}
                <Text style={styles.likeCountText}>
                  {item.likes || 0}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Interest Count */}
          <View style={styles.interestContainer}>
            <Text style={styles.interestText}>
              {Array.isArray(item.interestedUsers) ? item.interestedUsers.length : 0} 
              {Array.isArray(item.interestedUsers) && item.interestedUsers.length === 1 
                ? 'person' 
                : 'people'} 
              interested
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      {renderHeader()}
      
      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Create Button (Floating) */}
        {renderCreateButton()}
        
        {/* Posts List */}
        {!loading && posts.length === 0 ? (
          <View style={{ flex: 1 }}>{renderEmptyState()}</View>
        ) : (
          <FlatList
            data={posts}
            renderItem={renderPostItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchPosts();
                }}
                tintColor="#FF6B6B"
                title="Pull to refresh"
              />
            }
          />
        )}
        
        {/* Loading Indicator */}
        {loading && posts.length === 0 && (
          <View style={styles.centeredLoader}>
            <ActivityIndicator size="large" color="#FF6B6B" />
          </View>
        )}
      </View>
      
      {/* Create Post Modal */}
      <Modal 
        visible={showCreatePostModal} 
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Activity</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowCreatePostModal(false);
                  // Reset form
                  setNewActivity('');
                  setNewLocation('');
                  setNewDate('');
                  setNewTime('');
                  setIsUrgent(false);
                }}
              >
                <Text style={styles.modalCloseButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Activity Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="What activity would you like to do?"
                  value={newActivity}
                  onChangeText={setNewActivity}
                  autoFocus
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Where will this activity take place?"
                  value={newLocation}
                  onChangeText={setNewLocation}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  value={newDate}
                  onChangeText={setNewDate}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Time</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="HH:MM (24-hour format)"
                  value={newTime}
                  onChangeText={setNewTime}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Options</Text>
                <View style={styles.optionsRow}>
                  <View style={styles.optionItem}>
                    <Switch
                      value={isUrgent}
                      onValueChange={setIsUrgent}
                      thumbColor={isUrgent ? '#FF6B6B' : '#f4f3f4'}
                      trackColor={{ false: '#767577', true: '#81b0ff' }}
                    />
                    <Text style={styles.optionLabel}>Mark as Urgent</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.cancelButton, styles.button]}
                onPress={() => {
                  setShowCreatePostModal(false);
                  // Reset form
                  setNewActivity('');
                  setNewLocation('');
                  setNewDate('');
                  setNewTime('');
                  setIsUrgent(false);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.createButtonModal, styles.button]}
                onPress={handleCreatePost}
              >
                <Text style={styles.buttonText}>Create Activity</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFE5E5',
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  activeFilter: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  createButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#FF6B6B',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  createButtonContent: {
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  createButtonLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 4,
  },
  mainContent: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  urgentPost: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  urgentActivityText: {
    color: '#FF6B6B',
  },
  urgencyBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  urgencyBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  postDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#5D5D5D',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtonGroup: {
    flexDirection: 'row',
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  urgentJoinButton: {
    backgroundColor: '#FF6B6B',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  likeButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  likedButton: {
    backgroundColor: '#FFE5E5',
  },
  likeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeText: {
    fontSize: 18,
    color: '#FF6B6B',
  },
  likedText: {
    fontSize: 18,
    color: '#FF6B6B',
  },
  likeCountText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  interestContainer: {
    alignItems: 'flex-end',
  },
  interestText: {
    fontSize: 12,
    color: '#888888',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  modalCloseButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
  },
  modalContent: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  optionLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555555',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 12,
  },
  createButtonModal: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;