import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error('BREVO_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const displayName = name || email.split('@')[0];

    const emailContent = {
      sender: {
        name: "QuizGod",
        email: "noreply@quizgod.com"
      },
      to: [
        {
          email: email,
          name: displayName
        }
      ],
      subject: "Welcome to QuizGod! 🎓",
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎓 Welcome to QuizGod!</h1>
          </div>
          <div class="content">
            <h2>Hi ${displayName}! 👋</h2>
            <p>Thank you for joining QuizGod! We're excited to have you on board.</p>
            
            <p><strong>What you can do now:</strong></p>
            <ul>
              <li>📝 Create custom quizzes</li>
              <li>🤖 Generate AI-powered quizzes</li>
              <li>👥 Compete with friends</li>
              <li>📊 Track your progress</li>
              <li>🎯 Join live multiplayer quizzes</li>
            </ul>
            
            <p>Ready to test your knowledge?</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://quizgod.com'}" class="button">Start Your First Quiz</a>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Happy quizzing!</p>
            <p><strong>The QuizGod Team</strong></p>
          </div>
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>© ${new Date().getFullYear()} QuizGod. All rights reserved.</p>
          </div>
        </body>
        </html>
      `
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailContent)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Brevo API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to send email', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, messageId: data.messageId });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
