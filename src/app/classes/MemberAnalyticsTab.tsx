import React from 'react';

const MemberAnalyticsTab = ({ classId, memberId, quizzes, subjects }: any) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-white">👤 Member Analytics</h2>
      <p className="text-white">This is the member analytics tab for {memberId}. Implement member analytics display here.</p>
    </div>
  );
};

export default MemberAnalyticsTab;
