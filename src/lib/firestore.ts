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
import { db } from '@/lib/firebase';

// Enhanced Types for complete system
export interface FirebaseUser {
  uid: string;
  email: string;
  name: string;
  username?: string;
  preferences: {
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
  const userData: FirebaseUser = {
    uid,
    email,
    name,
    username,
    preferences: { theme: 'light' },
    createdAt: new Date(),
    updatedAt: new Date()
  };
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

// Class operations
export const createClass = async (
  name: string, 
  creatorId: string, 
  creatorEmail: string, 
  description?: string
): Promise<FirebaseClass> => {
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const classData: Omit<FirebaseClass, 'id'> = {
    name,
    description,
    creatorId,
    creatorEmail,
    members: [creatorEmail],
    memberRoles: { [creatorEmail]: 'president' },
    joinCode,
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
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
    const classesQuery = query(collection(db, 'classes'), where('joinCode', '==', joinCode));
    const querySnapshot = await getDocs(classesQuery);
    
    if (querySnapshot.empty) {
      throw new Error('Invalid join code');
    }
    
    const classDoc = querySnapshot.docs[0];
    const classData = classDoc.data() as FirebaseClass;
    
    if (classData.members.includes(userEmail)) {
      throw new Error('Already a member of this class');
    }
    
    // Update class with new member
    await updateDoc(classDoc.ref, {
      members: arrayUnion(userEmail),
      [`memberRoles.${userEmail}`]: 'member',
      updatedAt: new Date()
    });
    
    // Create membership record
    await addDoc(collection(db, 'classMemberships'), {
      userId,
      userEmail,
      classId: classDoc.id,
      role: 'member',
      joinedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error joining class:', error);
    throw error;
  }
};

export const getUserClasses = async (userEmail: string): Promise<FirebaseClass[]> => {
  try {
    const classesQuery = query(
      collection(db, 'classes'),
      where('members', 'array-contains', userEmail)
    );
    const querySnapshot = await getDocs(classesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseClass));
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
  const subjectRef = await addDoc(collection(db, 'subjects'), {
    name,
    userId,
    classId,
    isPersonal: !classId,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return subjectRef.id;
};

export const getUserSubjects = async (userId: string): Promise<FirebaseSubject[]> => {
  try {
    const subjectsQuery = query(
      collection(db, 'subjects'), 
      where('userId', '==', userId),
      where('isPersonal', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(subjectsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseSubject));
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
      ...doc.data()
    } as FirebaseSubject));
  } catch (error) {
    console.error('Error getting class subjects:', error);
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
  await deleteDoc(doc(db, 'subjects', subjectId));
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
      ...doc.data()
    } as FirebaseQuiz));
  } catch (error) {
    console.error('Error getting personal quizzes:', error);
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
      ...doc.data()
    } as FirebaseQuiz));
  } catch (error) {
    console.error('Error getting class quizzes:', error);
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
      ...doc.data()
    } as FirebaseQuiz));
  } catch (error) {
    console.error('Error getting quizzes by subject:', error);
    return [];
  }
};

export const deleteQuiz = async (quizId: string) => {
  await deleteDoc(doc(db, 'quizzes', quizId));
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
      ...doc.data()
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
      ...doc.data()
    } as FirebaseSubject));
    callback(subjects);
  });
};