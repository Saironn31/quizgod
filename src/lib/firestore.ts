import { collection, doc, getDocs, setDoc, deleteDoc, query, where, addDoc, updateDoc, getDoc, arrayUnion, arrayRemove, writeBatch, onSnapshot, orderBy } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
/**
 * Get all quiz records for quizzes belonging to a class
 */
export const getClassQuizRecords = async (classId: string): Promise<QuizRecord[]> => {
  // Get all quizzes for the class
  const quizzes = await getClassQuizzes(classId);
  const quizIds = quizzes.map(q => q.id);
  if (quizIds.length === 0) return [];
  // Query all quizRecords for these quizIds
  const records: QuizRecord[] = [];
  for (const quizId of quizIds) {
    const recordsQuery = query(
      collection(db, 'quizRecords'),
      where('quizId', '==', quizId)
    );
    const recordsSnap = await getDocs(recordsQuery);
    recordsSnap.docs.forEach(doc => {
      const data = doc.data();
      records.push({
        id: doc.id,
        userId: data.userId,
        quizId: data.quizId,
        score: data.score,
        mistakes: data.mistakes,
        selectedAnswers: data.selectedAnswers,
        timestamp: data.timestamp?.toDate?.() || new Date()
      });
    });
  }
  return records;
};

/**
 * Get all quiz records for a specific member in a class
 */
export const getClassMemberQuizRecords = async (classId: string, userId: string): Promise<QuizRecord[]> => {
  // Get all quizzes for the class
  const quizzes = await getClassQuizzes(classId);
  const quizIds = quizzes.map(q => q.id);
  if (quizIds.length === 0) return [];
  // Query all quizRecords for these quizIds and userId
  const records: QuizRecord[] = [];
  for (const quizId of quizIds) {
    const recordsQuery = query(
      collection(db, 'quizRecords'),
      where('quizId', '==', quizId),
      where('userId', '==', userId)
    );
    const recordsSnap = await getDocs(recordsQuery);
    recordsSnap.docs.forEach(doc => {
      const data = doc.data();
      records.push({
        id: doc.id,
        userId: data.userId,
        quizId: data.quizId,
        score: data.score,
        mistakes: data.mistakes,
        selectedAnswers: data.selectedAnswers,
        timestamp: data.timestamp?.toDate?.() || new Date()
      });
    });
  }
  return records;
};
/**
 * Get a map of quizId to number of unique users who played it (for notifications)
 */
export const getQuizPlayCountsForUser = async (userId: string): Promise<{ [quizId: string]: number }> => {
  // Get all quizzes created by user
  const quizzes = await getUserQuizzes(userId);
  const quizIds = quizzes.map(q => q.id);
  const playCounts: { [quizId: string]: number } = {};
  for (const quizId of quizIds) {
    // Get all records for this quiz
    const recordsQuery = query(
      collection(db, 'quizRecords'),
      where('quizId', '==', quizId)
    );
    const recordsSnap = await getDocs(recordsQuery);
    // Count unique userIds
    const uniqueUserIds = new Set<string>();
    recordsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.userId) uniqueUserIds.add(data.userId);
    });
    playCounts[quizId] = uniqueUserIds.size;
  }
  return playCounts;
};
/**
 * Send a class invite (friend request) to a class member
 * @param currentUid - UID of the current user (sender)
 * @param memberIdentifier - UID or email/username of the class member to invite
 * @returns UID of invited member
 */
/**
 * Send a class invite (friend request) to a class member
 * @param currentUid - UID of the current user (sender)
 * @param memberIdentifier - UID or email/username of the class member to invite
 * @returns UID of invited member
 */
export const sendClassInvite = async (currentUid: string, memberIdentifier: string): Promise<string> => {
  // Try to find user by UID, username, or email
  let memberUid = '';
  // If identifier looks like a UID (length 28, alphanumeric), use directly
  if (/^[a-zA-Z0-9]{28}$/.test(memberIdentifier)) {
    memberUid = memberIdentifier;
  } else {
    // Try username first
    const usersQuery = query(collection(db, 'users'), where('username', '==', memberIdentifier));
    const usernameSnap = await getDocs(usersQuery);
    if (!usernameSnap.empty) {
      memberUid = usernameSnap.docs[0].id;
    } else {
      // Try email
      const emailQuery = query(collection(db, 'users'), where('email', '==', memberIdentifier));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        memberUid = emailSnap.docs[0].id;
      }
    }
  }
  if (!memberUid || memberUid === currentUid) throw new Error('User not found or cannot invite yourself');
  // Create friend request document in friendRequests collection
  const friendRequestsRef = collection(db, 'friendRequests');
  await addDoc(friendRequestsRef, {
    senderUid: currentUid,
    receiverUid: memberUid,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return memberUid;
};
/**
 * Get friend requests for a user (received and sent)
 */
export const getFriendRequests = async (uid: string): Promise<any[]> => {
  const friendRequestsRef = collection(db, 'friendRequests');
  const receivedQuery = query(friendRequestsRef, where('receiverUid', '==', uid), where('status', '==', 'pending'));
  const sentQuery = query(friendRequestsRef, where('senderUid', '==', uid), where('status', '==', 'pending'));
  const [receivedSnap, sentSnap] = await Promise.all([
    getDocs(receivedQuery),
    getDocs(sentQuery)
  ]);
  const received = receivedSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'received' }));
  const sent = sentSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'sent' }));
  return [...received, ...sent];
};
/**
 * Share a personal quiz to a class (copies quiz and assigns classId)
 */
export const shareQuizToClass = async (quizId: string, targetClassId: string, userId: string): Promise<string> => {
  // Get the quiz
  const quizRef = doc(db, 'quizzes', quizId);
  const quizSnap = await getDoc(quizRef);
  if (!quizSnap.exists()) throw new Error('Quiz not found');
  const quizData = quizSnap.data();
  // Copy quiz and assign classId
  const newQuizData = {
    ...quizData,
    classId: targetClassId,
    isPersonal: false,
    userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const newQuizRef = await addDoc(collection(db, 'quizzes'), newQuizData);
  return newQuizRef.id;
};

// Helper function to convert Firestore Timestamps to Dates
const convertTimestamps = (data: any) => {
  const converted = { ...data };
  if (converted.createdAt?.toDate) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.updatedAt?.toDate) {
    converted.updatedAt = converted.updatedAt.toDate();
  }
  if (converted.joinedAt?.toDate) {
    converted.joinedAt = converted.joinedAt.toDate();
  }
  return converted;
};

// Enhanced Types for complete system
export interface ChatMessage {
  id?: string;
  senderUid: string;
  senderName: string;
  content: string;
  timestamp: Date;
  classId?: string; // For class-wide chat
  recipientUid?: string; // For private chat
}
export interface FirebaseUser {
  uid: string;
  email: string;
  name: string;
  username?: string;
  profilePicture?: string; // URL to profile picture
  bio?: string; // User biography
  friends?: string[]; // Array of user UIDs
  preferences?: {
    theme: 'light' | 'dark';
  };
  createdAt: Date;
  updatedAt: Date;
}

// --- Friend Request Functions ---
/**
 * Send a friend request by username or email
 */
export const sendFriendRequest = async (currentUid: string, identifier: string): Promise<string> => {
  // identifier can be username or email
  const usersQuery = query(collection(db, 'users'),
    where('username', '==', identifier));
  const usernameSnapshot = await getDocs(usersQuery);
  let friendUid = '';
  if (!usernameSnapshot.empty) {
    friendUid = usernameSnapshot.docs[0].id;
  } else {
    // Try email if username not found
    const emailQuery = query(collection(db, 'users'),
      where('email', '==', identifier));
    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) {
      friendUid = emailSnapshot.docs[0].id;
    }
  }
  if (!friendUid || friendUid === currentUid) throw new Error('User not found or cannot add yourself');
  // Create friend request document in friendRequests collection
  const friendRequestsRef = collection(db, 'friendRequests');
  await addDoc(friendRequestsRef, {
    senderUid: currentUid,
    receiverUid: friendUid,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return friendUid;
};

export interface FirebaseClass {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  creatorEmail: string;
  members: string[]; // Array of user emails
  memberRoles: { [email: string]: 'president' | 'member' };
  joinCode: string;

  isPublic: boolean;
}

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  const friendRequestsRef = doc(db, 'friendRequests', requestId);
  const requestSnap = await getDoc(friendRequestsRef);
  if (!requestSnap.exists()) throw new Error('Friend request not found');
  const request = requestSnap.data();
  const senderUid = request.senderUid;
  const receiverUid = request.receiverUid;
  // Add each user to the other's friends array
  const senderRef = doc(db, 'users', senderUid);
  const receiverRef = doc(db, 'users', receiverUid);
  await Promise.all([
    updateDoc(senderRef, {
      friends: arrayUnion(receiverUid),
      updatedAt: new Date()
    }),
    updateDoc(receiverRef, {
      friends: arrayUnion(senderUid),
      updatedAt: new Date()
    }),
    updateDoc(friendRequestsRef, {
      status: 'accepted',
      updatedAt: new Date()
    })
  ]);
};

/**
 * Decline a friend request
 */
export const declineFriendRequest = async (requestId: string): Promise<void> => {
  const friendRequestsRef = doc(db, 'friendRequests', requestId);
  await updateDoc(friendRequestsRef, {
    status: 'declined',
    updatedAt: new Date()
  });
};

export interface FirebaseSubject {
  id: string;
  name: string;
  userId: string;
  classId?: string; // Optional - belongs to class if set
  isPersonal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirebaseQuiz {
  id: string;
  title: string;
  subject: string;
  description?: string;
  subjectId?: string;
  questions: Array<{
    question: string;
    options: string[];
    correct: number;
  }>;
  userId: string;
  classId?: string; // Optional - belongs to class if set
  isPersonal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserClassMembership {
  userId: string;
  userEmail: string;
  classId: string;
  role: 'president' | 'member';
  joinedAt: Date;
}

// User operations
/**
 * Send a chat message (class-wide or private)
 */
export const sendChatMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> => {
  const msgData = {
    ...message,
    timestamp: new Date()
  };
  const ref = await addDoc(collection(db, 'chatMessages'), msgData);
  return ref.id;
};

/**
 * Get chat messages for a class
 */
export const getClassChatMessages = async (classId: string): Promise<ChatMessage[]> => {
  const msgsQuery = query(collection(db, 'chatMessages'), where('classId', '==', classId), orderBy('timestamp', 'asc'));
  const snap = await getDocs(msgsQuery);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate?.() || new Date() } as ChatMessage));
};

/**
 * Get private chat messages between two users
 */
export const getPrivateChatMessages = async (uid1: string, uid2: string): Promise<ChatMessage[]> => {
  const msgsQuery = query(collection(db, 'chatMessages'),
    where('recipientUid', 'in', [uid1, uid2]),
    where('senderUid', 'in', [uid1, uid2]),
    orderBy('timestamp', 'asc'));
  const snap = await getDocs(msgsQuery);
  // Only messages where sender/recipient are the two users
  return snap.docs
    .map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate?.() || new Date() } as ChatMessage))
    .filter(msg => (msg.senderUid === uid1 && msg.recipientUid === uid2) || (msg.senderUid === uid2 && msg.recipientUid === uid1));
};
/**
 * Add a friend by username or email
 */
export const addFriend = async (currentUid: string, identifier: string): Promise<string> => {
  // identifier can be username or email
  const usersQuery = query(collection(db, 'users'),
    where('username', '==', identifier));
  const usernameSnapshot = await getDocs(usersQuery);
  let friendUid = '';
  if (!usernameSnapshot.empty) {
    friendUid = usernameSnapshot.docs[0].id;
  } else {
    // Try email if username not found
    const emailQuery = query(collection(db, 'users'),
      where('email', '==', identifier));
    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) {
      friendUid = emailSnapshot.docs[0].id;
    }
  }
  if (!friendUid || friendUid === currentUid) throw new Error('User not found or cannot add yourself');
  // Add friendUid to current user's friends array
  const userRef = doc(db, 'users', currentUid);
  const friendRef = doc(db, 'users', friendUid);
  // Update both users for mutual friendship
  await Promise.all([
    updateDoc(userRef, {
      friends: arrayUnion(friendUid),
      updatedAt: new Date()
    }),
    updateDoc(friendRef, {
      friends: arrayUnion(currentUid),
      updatedAt: new Date()
    })
  ]);
  return friendUid;
};

/**
 * Remove a friend by UID
 */
export const removeFriend = async (currentUid: string, friendUid: string): Promise<void> => {
  const userRef = doc(db, 'users', currentUid);
  const friendRef = doc(db, 'users', friendUid);
  await Promise.all([
    updateDoc(userRef, {
      friends: arrayRemove(friendUid),
      updatedAt: new Date()
    }),
    updateDoc(friendRef, {
      friends: arrayRemove(currentUid),
      updatedAt: new Date()
    })
  ]);
};
export const createUserProfile = async (uid: string, email: string, name: string, username?: string) => {
  const userRef = doc(db, 'users', uid);
  const userData: any = {
    uid,
    email,
    name,
    preferences: { theme: 'light' },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Only add username if it's provided
  if (username) {
    userData.username = username;
  }
  
  await setDoc(userRef, userData);
  return userData;
};

export const updateUserProfile = async (uid: string, updates: Partial<FirebaseUser>) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: new Date()
  });
};

export const getUserProfile = async (uid: string): Promise<FirebaseUser | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as FirebaseUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Profile picture operations
// Removed profile picture upload and delete functions

// Class operations
/**
 * Delete a class and all its quizzes (president only)
 */
export const deleteClassWithQuizzes = async (classId: string): Promise<void> => {
  // Delete all quizzes for this class
  const quizzesQuery = query(collection(db, 'quizzes'), where('classId', '==', classId));
  const quizzesSnapshot = await getDocs(quizzesQuery);
  const batch = writeBatch(db);
  quizzesSnapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
  // Delete all subjects for this class
  const subjectsQuery = query(collection(db, 'subjects'), where('classId', '==', classId));
  const subjectsSnapshot = await getDocs(subjectsQuery);
  subjectsSnapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
  // Delete class membership records
  const membershipsQuery = query(collection(db, 'classMemberships'), where('classId', '==', classId));
  const membershipsSnapshot = await getDocs(membershipsQuery);
  membershipsSnapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
  // Delete the class itself
  batch.delete(doc(db, 'classes', classId));
  await batch.commit();
};
/**
 * Remove a member from a class. Only president should call this.
 * @param classId - The class document ID
 * @param memberEmail - The email of the member to remove
 */
export const removeMemberFromClass = async (classId: string, memberEmail: string): Promise<void> => {
  const classRef = doc(db, 'classes', classId);
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) throw new Error('Class not found');

  const classData = classSnap.data();
  const updatedMembers = (classData.members || []).filter((email: string) => email !== memberEmail);
  const updatedMemberRoles = { ...classData.memberRoles };
  delete updatedMemberRoles[memberEmail];

  // Update class document
  await updateDoc(classRef, {
    members: updatedMembers,
    memberRoles: updatedMemberRoles,
    updatedAt: new Date()
  });

  // Remove membership record
  const membershipsQuery = query(
    collection(db, 'classMemberships'),
    where('classId', '==', classId),
    where('userEmail', '==', memberEmail)
  );
  const membershipsSnap = await getDocs(membershipsQuery);
  for (const docSnap of membershipsSnap.docs) {
    await deleteDoc(docSnap.ref);
  }
};
export const createClass = async (
  name: string, 
  creatorId: string, 
  creatorEmail: string, 
  description?: string
): Promise<FirebaseClass> => {
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const classData: any = {
    name,
    creatorId,
    creatorEmail,
    members: [creatorEmail],
    memberRoles: { [creatorEmail]: 'president' },
    joinCode,
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Only add description if it's provided and not empty
  if (description && description.trim()) {
    classData.description = description.trim();
  }
  
  const classRef = await addDoc(collection(db, 'classes'), classData);
  
  // Create membership record
  await addDoc(collection(db, 'classMemberships'), {
    userId: creatorId,
    userEmail: creatorEmail,
    classId: classRef.id,
    role: 'president',
    joinedAt: new Date()
  });
  
  return { id: classRef.id, ...classData };
};

export const joinClass = async (joinCode: string, userId: string, userEmail: string): Promise<boolean> => {
  try {
    console.log('Attempting to join class with code:', joinCode);
    const classesQuery = query(collection(db, 'classes'), where('joinCode', '==', joinCode));
    const querySnapshot = await getDocs(classesQuery);
    
    if (querySnapshot.empty) {
      console.log('No classes found with join code:', joinCode);
      throw new Error('Invalid join code');
    }
    
    const classDoc = querySnapshot.docs[0];
    const classData = classDoc.data() as FirebaseClass;
    console.log('Found class:', classData.name, 'with members:', classData.members);
    
    if (classData.members.includes(userEmail)) {
      throw new Error('Already a member of this class');
    }
    
    console.log('Starting class update...');
    // Update class with new member
    try {
      await updateDoc(classDoc.ref, {
        members: arrayUnion(userEmail),
        [`memberRoles.${userEmail}`]: 'member',
        updatedAt: new Date()
      });
      console.log('Class document updated successfully');
    } catch (updateError) {
      console.error('Error updating class document:', updateError);
      throw new Error(`Failed to update class: ${updateError}`);
    }
    
    console.log('Creating membership record...');
    // Create membership record
    try {
      await addDoc(collection(db, 'classMemberships'), {
        userId,
        userEmail,
        classId: classDoc.id,
        role: 'member',
        joinedAt: new Date()
      });
      console.log('Membership record created successfully');
    } catch (membershipError) {
      console.error('Error creating membership record:', membershipError);
      throw new Error(`Failed to create membership record: ${membershipError}`);
    }
    
    console.log('Successfully joined class');
    return true;
  } catch (error) {
    console.error('Error joining class:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to join class: ${error.message}`);
    }
    throw new Error('Failed to join class: Unknown error');
  }
};

export const getUserClasses = async (userEmail: string): Promise<FirebaseClass[]> => {
  try {
    const classesQuery = query(
      collection(db, 'classes'),
      where('members', 'array-contains', userEmail)
    );
    const querySnapshot = await getDocs(classesQuery);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        creatorId: data.creatorId,
        creatorEmail: data.creatorEmail,
        members: data.members || [],
        memberRoles: data.memberRoles || {},
        joinCode: data.joinCode,
        isPublic: data.isPublic,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    });
  } catch (error) {
    console.error('Error getting user classes:', error);
    return [];
  }
};

export const getClassById = async (classId: string): Promise<FirebaseClass | null> => {
  try {
    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);
    if (classSnap.exists()) {
      const data = classSnap.data();
      // Convert Firestore Timestamps to JS Dates
      if (data.createdAt?.toDate) data.createdAt = data.createdAt.toDate();
      if (data.updatedAt?.toDate) data.updatedAt = data.updatedAt.toDate();
      if (data.joinedAt?.toDate) data.joinedAt = data.joinedAt.toDate();
      return { id: classSnap.id, ...data } as FirebaseClass;
    }
    return null;
  } catch (error) {
    console.error('Error getting class:', error);
    return null;
  }
};

// Subject operations
export const createSubject = async (
  name: string, 
  userId: string, 
  classId?: string
): Promise<string> => {
  const subjectData: any = {
    name,
    userId,
    isPersonal: !classId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Only add classId if it's provided
  if (classId) {
    subjectData.classId = classId;
  }
  
  const subjectRef = await addDoc(collection(db, 'subjects'), subjectData);
  return subjectRef.id;
};

export const getUserSubjects = async (userId: string): Promise<FirebaseSubject[]> => {
  try {
    const subjectsQuery = query(
      collection(db, 'subjects'), 
      where('userId', '==', userId),
      where('isPersonal', '==', true)
    );
    const querySnapshot = await getDocs(subjectsQuery);
    const subjects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as FirebaseSubject));
    
    // Sort client-side to avoid index requirement
    return subjects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting personal subjects:', error);
    return [];
  }
};

export const getClassSubjects = async (classId: string): Promise<FirebaseSubject[]> => {
  try {
    const subjectsQuery = query(
      collection(db, 'subjects'),
      where('classId', '==', classId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(subjectsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as FirebaseSubject));
  } catch (error: any) {
    console.error('Error getting class subjects:', error);
    
    // Always try fallback for any Firebase query error (index errors are common)
    console.warn('Firebase query failed, trying fallback without composite index...');
    try {
      const fallbackQuery = query(
        collection(db, 'subjects'),
        where('classId', '==', classId)
      );
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const subjects = fallbackSnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as FirebaseSubject));
      // Sort manually by createdAt
      console.log('Fallback query succeeded, returning', subjects.length, 'class subjects');
      return subjects.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      return [];
    }
    
    return [];
  }
};

export const getAllUserSubjects = async (userId: string, userEmail: string): Promise<FirebaseSubject[]> => {
  try {
    // Get personal subjects
    const personalSubjects = await getUserSubjects(userId);
    
    // Get class subjects from classes user is a member of
    const userClasses = await getUserClasses(userEmail);
    const classSubjects: FirebaseSubject[] = [];
    
    for (const classInfo of userClasses) {
      const subjects = await getClassSubjects(classInfo.id);
      classSubjects.push(...subjects);
    }
    
    return [...personalSubjects, ...classSubjects];
  } catch (error) {
    console.error('Error getting all user subjects:', error);
    return [];
  }
};

export const deleteSubject = async (subjectId: string) => {
  try {
    // First, find and delete all quizzes associated with this subject
    const quizzesQuery = query(
      collection(db, 'quizzes'), 
      where('subjectId', '==', subjectId)
    );
    const quizzesSnapshot = await getDocs(quizzesQuery);
    
    // Use batch to delete all associated quizzes
    const batch = writeBatch(db);
    quizzesSnapshot.docs.forEach((quizDoc) => {
      batch.delete(quizDoc.ref);
    });
    
    // Also delete the subject itself
    const subjectRef = doc(db, 'subjects', subjectId);
    batch.delete(subjectRef);
    
    // Commit all deletions
    await batch.commit();
    
    console.log(`Deleted subject ${subjectId} and ${quizzesSnapshot.docs.length} associated quizzes`);
  } catch (error) {
    console.error('Error deleting subject and associated quizzes:', error);
    throw error;
  }
};

// Quiz operations
export const createQuiz = async (quiz: Omit<FirebaseQuiz, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const quizRef = await addDoc(collection(db, 'quizzes'), {
    ...quiz,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return quizRef.id;
};

export const getUserQuizzes = async (userId: string): Promise<FirebaseQuiz[]> => {
  try {
    const quizzesQuery = query(
      collection(db, 'quizzes'), 
      where('userId', '==', userId),
      where('isPersonal', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(quizzesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as FirebaseQuiz));
  } catch (error: any) {
    console.error('Error getting personal quizzes:', error);
    
    // Always try fallback for any Firebase query error (index errors are common)
    console.warn('Firebase query failed, trying fallback without composite index...');
    try {
      const fallbackQuery = query(
        collection(db, 'quizzes'),
        where('userId', '==', userId)
      );
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const quizzes = fallbackSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...convertTimestamps(doc.data())
        } as FirebaseQuiz))
        .filter(quiz => quiz.isPersonal === true);
      // Sort manually by createdAt
      console.log('Fallback query succeeded, returning', quizzes.length, 'personal quizzes');
      return quizzes.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      return [];
    }
    
    return [];
  }
};

export const getClassQuizzes = async (classId: string): Promise<FirebaseQuiz[]> => {
  try {
    const quizzesQuery = query(
      collection(db, 'quizzes'),
      where('classId', '==', classId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(quizzesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as FirebaseQuiz));
  } catch (error: any) {
    console.error('Error getting class quizzes:', error);
    
    // Always try fallback for any Firebase query error (index errors are common)
    console.warn('Firebase query failed, trying fallback without composite index...');
    try {
      const fallbackQuery = query(
        collection(db, 'quizzes'),
        where('classId', '==', classId)
      );
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const quizzes = fallbackSnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as FirebaseQuiz));
      // Sort manually by createdAt
      console.log('Fallback query succeeded, returning', quizzes.length, 'class quizzes');
      return quizzes.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      return [];
    }
    
    return [];
  }
};

export const getAllUserQuizzes = async (userId: string, userEmail: string): Promise<FirebaseQuiz[]> => {
  try {
    // Get personal quizzes
    const personalQuizzes = await getUserQuizzes(userId);
    
    // Get class quizzes from classes user is a member of
    const userClasses = await getUserClasses(userEmail);
    const classQuizzes: FirebaseQuiz[] = [];
    
    for (const classInfo of userClasses) {
      const quizzes = await getClassQuizzes(classInfo.id);
      classQuizzes.push(...quizzes);
    }
    
    return [...personalQuizzes, ...classQuizzes];
  } catch (error) {
    console.error('Error getting all user quizzes:', error);
    return [];
  }
};

export const getQuizzesBySubject = async (userId: string, subject: string): Promise<FirebaseQuiz[]> => {
  try {
    const quizzesQuery = query(
      collection(db, 'quizzes'),
      where('userId', '==', userId),
      where('subject', '==', subject),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(quizzesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as FirebaseQuiz));
  } catch (error) {
    console.error('Error getting quizzes by subject:', error);
    return [];
  }
};

export const deleteQuiz = async (quizId: string) => {
  await deleteDoc(doc(db, 'quizzes', quizId));
};

export const getQuizById = async (quizId: string): Promise<FirebaseQuiz | null> => {
  try {
    const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
    if (quizDoc.exists()) {
      const data = quizDoc.data();
      return {
        id: quizDoc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as FirebaseQuiz;
    }
    return null;
  } catch (error) {
    console.error('Error getting quiz by ID:', error);
    return null;
  }
};

// Quiz Record operations
export interface QuizRecord {
  id?: string;
  userId: string;
  quizId: string;
  subject?: string;
  score: number;
  mistakes: Array<{ question: string; selected: number; correct: number }>;
  selectedAnswers: number[];
  timestamp: Date;
}

export const saveQuizRecord = async (record: Omit<QuizRecord, 'id'>): Promise<string> => {
  // Fetch subject from quiz if not provided
  let subject = record.subject;
  if (!subject && record.quizId) {
    const quiz = await getQuizById(record.quizId);
    subject = quiz?.subject;
  }
  const ref = await addDoc(collection(db, 'quizRecords'), {
    ...record,
    subject,
    timestamp: new Date()
  });
  return ref.id;
};

/**
 * Get all quiz records for a user (for NavBar analytics summary)
 */
export const getUserQuizRecords = async (userId: string): Promise<QuizRecord[]> => {
  const recordsQuery = query(
    collection(db, 'quizRecords'),
    where('userId', '==', userId)
  );
  const recordsSnap = await getDocs(recordsQuery);
  const records: QuizRecord[] = [];
  recordsSnap.docs.forEach(doc => {
    const data = doc.data();
    records.push({
      id: doc.id,
      userId: data.userId,
      quizId: data.quizId,
      subject: data.subject || undefined,
      score: data.score,
      mistakes: data.mistakes,
      selectedAnswers: data.selectedAnswers,
      timestamp: data.timestamp?.toDate?.() || new Date()
    });
  });
  return records;
};
// Migration and utility functions
export const migrateLocalDataToFirestore = async (userId: string, userEmail: string) => {
    // Migrate historical quizRecords to populate missing subject fields
    const recordsQuery = query(
      collection(db, 'quizRecords'),
      where('userId', '==', userId)
    );
    const recordsSnap = await getDocs(recordsQuery);
    for (const doc of recordsSnap.docs) {
      const data = doc.data();
      if (!data.subject && data.quizId) {
        const quiz = await getQuizById(data.quizId);
        if (quiz?.subject) {
          await updateDoc(doc.ref, { subject: quiz.subject });
        }
      }
    }
  try {
    console.log('Starting migration of localStorage data to Firestore...');
    
    // Migrate personal subjects
    const localSubjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    for (const subject of localSubjects) {
      if (typeof subject === 'string') {
        await createSubject(subject, userId);
      } else if (subject.name) {
        await createSubject(subject.name, userId);
      }
    }

    // Migrate personal quizzes
    const localQuizzes = JSON.parse(localStorage.getItem('qg_quizzes') || '[]');
    for (const quiz of localQuizzes) {
      if (quiz.title && quiz.questions) {
        await createQuiz({
          title: quiz.title,
          subject: quiz.subject || 'General',
          questions: quiz.questions,
          userId,
          isPersonal: true
        });
      }
    }

    // Migrate classes
    const allClasses = JSON.parse(localStorage.getItem('qg_all_classes') || '[]');
    for (const classData of allClasses) {
      if (classData.name && classData.members?.includes(userEmail)) {
        const isCreator = classData.creatorEmail === userEmail || classData.members[0] === userEmail;
        
        if (isCreator) {
          // Create the class
          const newClass = await createClass(
            classData.name,
            userId,
            userEmail,
            classData.description
          );
          
          // Migrate class subjects
          const classSubjects = JSON.parse(localStorage.getItem(`qg_class_subjects_${classData.id}`) || '[]');
          for (const subject of classSubjects) {
            if (subject.name) {
              await createSubject(subject.name, userId, newClass.id);
            }
          }
          
          // Migrate class quizzes
          const classQuizKeys = JSON.parse(localStorage.getItem(`qg_class_quizzes_${classData.id}`) || '[]');
          for (const quizKey of classQuizKeys) {
            const quizData = JSON.parse(localStorage.getItem(quizKey) || '{}');
            if (quizData.title && quizData.questions) {
              await createQuiz({
                title: quizData.title,
                subject: quizData.subject || 'General',
                questions: quizData.questions,
                userId,
                classId: newClass.id,
                isPersonal: false
              });
            }
          }
        }
      }
    }

    console.log('LocalStorage data migrated to Firestore successfully');
    return true;
  } catch (error) {
    console.error('Error migrating local data:', error);
    return false;
  }
};

export const clearLocalStorageAfterMigration = () => {
  const keysToRemove = [
    'qg_all_classes',
    'qg_quizzes',
    'subjects'
  ];
  
  // Remove specific keys
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Remove dynamic keys (classes, subjects, quizzes, etc.)
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith('qg_class_') || 
        key.startsWith('qg_user_classes_') || 
        key.startsWith('qg_class_role_') ||
        key.startsWith('qg_user_data_') ||
        key.startsWith('qg_username_')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('LocalStorage cleaned up after migration');
};

// Real-time listeners
export const subscribeToUserClasses = (
  userEmail: string, 
  callback: (classes: FirebaseClass[]) => void
) => {
  const q = query(
    collection(db, 'classes'),
    where('members', 'array-contains', userEmail)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const classes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as FirebaseClass));
    callback(classes);
  });
};

export const subscribeToClassSubjects = (
  classId: string,
  callback: (subjects: FirebaseSubject[]) => void
) => {
  const q = query(
    collection(db, 'subjects'),
    where('classId', '==', classId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const subjects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as FirebaseSubject));
    callback(subjects);
  });
};

export const subscribeToClassChatMessages = (
  classId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const q = query(
    collection(db, 'chatMessages'),
    where('classId', '==', classId),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as ChatMessage));
    callback(messages);
  });
};

export const subscribeToFriendRequests = (
  userId: string,
  callback: (requests: any[]) => void
) => {
  const q = query(
    collection(db, 'friendRequests'),
    where('receiverUid', '==', userId),
    where('status', '==', 'pending')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }));
    callback(requests);
  });
};

export const subscribeToSentFriendRequests = (
  userId: string,
  callback: (requests: any[]) => void
) => {
  const q = query(
    collection(db, 'friendRequests'),
    where('senderUid', '==', userId)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }));
    callback(requests);
  });
};

/**
 * Add all members of a class as friends for the current user (mutual friendship)
 * @param currentUid - UID of the current user
 * @param classId - ID of the class
 */
export const addClassMembersAsFriends = async (currentUid: string, classId: string): Promise<string[]> => {
  // Get class document
  const classRef = doc(db, 'classes', classId);
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) throw new Error('Class not found');
  const classData = classSnap.data() as FirebaseClass;
  // Get all member emails except current user
  const memberEmails = (classData.members || []).filter(email => !!email);
  // Get UIDs for all member emails
  const usersQuery = query(collection(db, 'users'), where('email', 'in', memberEmails));
  const usersSnap = await getDocs(usersQuery);
  const memberUids = usersSnap.docs.map(doc => doc.id).filter(uid => uid !== currentUid);
  // Add each member as friend (mutual)
  const currentUserRef = doc(db, 'users', currentUid);
  const batch = writeBatch(db);
  memberUids.forEach(uid => {
    const memberRef = doc(db, 'users', uid);
    batch.update(currentUserRef, { friends: arrayUnion(uid), updatedAt: new Date() });
    batch.update(memberRef, { friends: arrayUnion(currentUid), updatedAt: new Date() });
  });
  await batch.commit();
  return memberUids;
};