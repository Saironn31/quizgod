import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

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
export interface FirebaseUser {
  uid: string;
  email: string;
  name: string;
  username?: string;
  profilePicture?: string; // URL to profile picture
  preferences?: {
    theme: 'light' | 'dark';
  };
  createdAt: Date;
  updatedAt: Date;
}

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
  createdAt: Date;
  updatedAt: Date;
}

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
export const uploadProfilePicture = async (uid: string, file: File): Promise<string> => {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `profile_${uid}_${timestamp}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `profile-pictures/${fileName}`);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update user profile with new picture URL
    await updateUserProfile(uid, { profilePicture: downloadURL });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

export const deleteProfilePicture = async (uid: string, profilePictureUrl: string): Promise<void> => {
  try {
    // Extract the file path from the URL
    const url = new URL(profilePictureUrl);
    const filePath = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
    const storageRef = ref(storage, filePath);
    
    // Delete from storage
    await deleteObject(storageRef);
    
    // Remove from user profile
    await updateUserProfile(uid, { profilePicture: undefined });
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw error;
  }
};

// Class operations
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
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as FirebaseClass;
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
      return { id: classSnap.id, ...classSnap.data() } as FirebaseClass;
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

// Migration and utility functions
export const migrateLocalDataToFirestore = async (userId: string, userEmail: string) => {
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