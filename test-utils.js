// Simple test to verify our utilities work
const { generateQuestionsFromText } = require('./src/utils/questionGenerator');

const sampleText = `
The water cycle is a continuous process by which water moves through the Earth's atmosphere and surface. 
It consists of several key stages: evaporation, condensation, precipitation, and collection. 

Evaporation occurs when water from oceans, lakes, and rivers is heated by the sun and turns into water vapor. 
This water vapor rises into the atmosphere where it cools and undergoes condensation, forming clouds. 
When the water droplets in clouds become too heavy, they fall as precipitation in the form of rain, snow, or hail. 
Finally, the water collects in bodies of water or infiltrates into the ground, where the cycle begins again.

The water cycle is essential for life on Earth as it distributes fresh water across the planet and helps regulate temperature.
`;

console.log('Testing Question Generator...');

try {
  const questions = generateQuestionsFromText(sampleText, {
    numQuestions: 5,
    difficulty: 'medium',
    questionTypes: ['factual', 'conceptual']
  });
  
  console.log('\n✅ Success! Generated questions:');
  questions.forEach((q, i) => {
    console.log(`\n${i + 1}. ${q.question}`);
    q.options.forEach((opt, j) => {
      console.log(`   ${String.fromCharCode(97 + j)}) ${opt}`);
    });
    console.log(`   Correct: ${String.fromCharCode(97 + q.correct)}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
