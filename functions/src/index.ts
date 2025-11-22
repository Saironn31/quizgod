


import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { UserRecord } from "firebase-admin/auth";

admin.initializeApp();

// Send welcome email when a new user signs up (v2 API)
export const sendWelcomeEmail = functions.auth.user().onCreate(async (user: UserRecord) => {
	const email = user.email;
	const displayName = user.displayName || 'there';
	
	if (!email) {
		console.log('No email found for user:', user.uid);
		return null;
	}

	try {
		// Store email task in Firestore for processing
		// This allows you to use any email service (SendGrid, Mailgun, etc.)
		await admin.firestore().collection('mail').add({
			to: email,
			message: {
				subject: 'Welcome to QuizGod! 🎉',
				html: `
					<!DOCTYPE html>
					<html>
					<head>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
							.container { max-width: 600px; margin: 0 auto; padding: 20px; }
							.header { background: linear-gradient(135deg, #22d3ee 0%, #8b5cf6 50%, #ec4899 100%); 
									  color: white; padding: 30px; text-align: center; border-radius: 10px; }
							.content { background: #f9fafb; padding: 30px; border-radius: 10px; margin-top: 20px; }
							.button { display: inline-block; background: linear-gradient(135deg, #22d3ee, #8b5cf6); 
									  color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; 
									  font-weight: bold; margin-top: 20px; }
							.features { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
							.feature-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
							.feature-item:last-child { border-bottom: none; }
							.footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<h1 style="margin: 0; font-size: 32px;">Welcome to QuizGod!</h1>
								<p style="margin: 10px 0 0 0; font-size: 16px;">Your journey to quiz mastery begins now</p>
							</div>
							<div class="content">
								<h2>Hey ${displayName}! 👋</h2>
								<p>We're thrilled to have you join our community of quiz enthusiasts!</p>
								<p>QuizGod is your ultimate platform for creating, sharing, and taking quizzes on any topic you can imagine.</p>
								
								<div class="features">
									<h3 style="margin-top: 0; color: #8b5cf6;">What you can do:</h3>
									<div class="feature-item">📝 <strong>Create Custom Quizzes</strong> - Build quizzes with multiple question types</div>
									<div class="feature-item">🤖 <strong>AI-Powered Quiz Generation</strong> - Let AI create quizzes for you</div>
									<div class="feature-item">📊 <strong>Track Your Progress</strong> - View detailed analytics and statistics</div>
									<div class="feature-item">👥 <strong>Compete with Friends</strong> - Challenge friends and see who's the quiz master</div>
									<div class="feature-item">🎮 <strong>Live Multiplayer</strong> - Join real-time quiz battles</div>
									<div class="feature-item">⭐ <strong>Upgrade to Premium</strong> - Unlock advanced features and unlimited quizzes</div>
								</div>

								<p style="margin-top: 20px;">Ready to get started?</p>
								<a href="https://quizgod.vercel.app" class="button">Start Creating Quizzes</a>
							</div>
							
							<div class="footer">
								<p>Need help? Visit our <a href="https://quizgod.vercel.app" style="color: #8b5cf6;">website</a> or reply to this email</p>
								<p>© 2025 QuizGod. All rights reserved.</p>
							</div>
						</div>
					</body>
					</html>
				`,
				text: `
Welcome to QuizGod! 🎉

Hey ${displayName}!

We're thrilled to have you join our community of quiz enthusiasts!

QuizGod is your ultimate platform for creating, sharing, and taking quizzes on any topic you can imagine.

What you can do:
- 📝 Create Custom Quizzes - Build quizzes with multiple question types
- 🤖 AI-Powered Quiz Generation - Let AI create quizzes for you
- 📊 Track Your Progress - View detailed analytics and statistics
- 👥 Compete with Friends - Challenge friends and see who's the quiz master
- 🎮 Live Multiplayer - Join real-time quiz battles
- ⭐ Upgrade to Premium - Unlock advanced features and unlimited quizzes

Ready to get started? Visit: https://quizgod.vercel.app

Need help? Reply to this email or visit our website.

© 2025 QuizGod. All rights reserved.
				`
			}
		});

		console.log('Welcome email queued for:', email);
		return null;
	} catch (error) {
		console.error('Error sending welcome email:', error);
		return null;
	}
});

export const acceptFriendRequest = functions.https.onCall(async (data: any, context: any) => {
	const { senderUid, receiverUid, requestId } = data;
	if (!context.auth) {
		throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
	}
	const senderRef = admin.firestore().collection('users').doc(senderUid);
	const receiverRef = admin.firestore().collection('users').doc(receiverUid);
	const requestRef = admin.firestore().collection('friendRequests').doc(requestId);

	await senderRef.update({
		friends: admin.firestore.FieldValue.arrayUnion(receiverUid),
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	});

	await receiverRef.update({
		friends: admin.firestore.FieldValue.arrayUnion(senderUid),
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	});

	await requestRef.update({
		status: 'accepted',
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	});

	return { success: true };
});
// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.


