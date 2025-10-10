// Firebase Admin migration script to update quizRecords with missing subject fields
// Usage: node migrate-quiz-records.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateQuizRecords() {
  const recordsSnap = await db.collection('quizRecords').get();
  let updated = 0;
  for (const doc of recordsSnap.docs) {
    const data = doc.data();
    if (!data.subject && data.quizId) {
      const quizSnap = await db.collection('quizzes').doc(data.quizId).get();
      const quiz = quizSnap.data();
      if (quiz && quiz.subject) {
        await doc.ref.update({ subject: quiz.subject });
        updated++;
        console.log(`Updated record ${doc.id} with subject: ${quiz.subject}`);
      }
    }
  }
  console.log(`Migration complete. Updated ${updated} records.`);
}

migrateQuizRecords().catch(console.error);