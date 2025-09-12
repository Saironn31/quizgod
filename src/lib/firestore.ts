import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types
export interface FirebaseUser {
  uid: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface FirebaseSubject {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
}

export interface FirebaseQuiz {
  id: string;
  title: string;
  subject: string;
  questions: Array<{
    question: string;
    options: string[];
    correct: number;
  }>;
  userId: string;
  createdAt: Date;
}

// User operations
export const createUserProfile = async (uid: string, email: string, name: string) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    uid,
    email,
    name,
    createdAt: new Date()
  });
};

export const getUserProfile = async (uid: string): Promise<FirebaseUser | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)));
    if (!userSnap.empty) {
      return userSnap.docs[0].data() as FirebaseUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Subject operations
export const createSubject = async (name: string, userId: string): Promise<string> => {
  const subjectRef = await addDoc(collection(db, 'subjects'), {
    name,
    userId,
    createdAt: new Date()
  });
  return subjectRef.id;
};

export const getUserSubjects = async (userId: string): Promise<FirebaseSubject[]> => {
  try {
    const subjectsQuery = query(
      collection(db, 'subjects'), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(subjectsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseSubject));
  } catch (error) {
    console.error('Error getting subjects:', error);
    return [];
  }
};

export const deleteSubject = async (subjectId: string) => {
  await deleteDoc(doc(db, 'subjects', subjectId));
};

// Quiz operations
export const createQuiz = async (quiz: Omit<FirebaseQuiz, 'id' | 'createdAt'>): Promise<string> => {
  const quizRef = await addDoc(collection(db, 'quizzes'), {
    ...quiz,
    createdAt: new Date()
  });
  return quizRef.id;
};

export const getUserQuizzes = async (userId: string): Promise<FirebaseQuiz[]> => {
  try {
    const quizzesQuery = query(
      collection(db, 'quizzes'), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(quizzesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseQuiz));
  } catch (error) {
    console.error('Error getting quizzes:', error);
    return [];
  }
};

export const getQuizzesBySubject = async (userId: string, subject: string): Promise<FirebaseQuiz[]> => {
  try {
    const quizzesQuery = query(
      collection(db, 'quizzes'),
      where('userId', '==', userId),
      where('subject', '==', subject)
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

// Migration helper - convert localStorage data to Firestore
export const migrateLocalDataToFirestore = async (userId: string) => {
  try {
    // Migrate subjects
    const localSubjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    for (const subject of localSubjects) {
      if (typeof subject === 'string') {
        await createSubject(subject, userId);
      } else if (subject.name) {
        await createSubject(subject.name, userId);
      }
    }

    // Migrate quizzes
    const localQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    for (const quiz of localQuizzes) {
      if (quiz.title && quiz.questions) {
        await createQuiz({
          title: quiz.title,
          subject: quiz.subject || 'General',
          questions: quiz.questions,
          userId
        });
      }
    }

    console.log('Local data migrated to Firestore successfully');
  } catch (error) {
    console.error('Error migrating local data:', error);
  }
};