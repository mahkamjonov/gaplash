/**
 * Free-talk topics, each with questions at three levels. Add topics or questions freely:
 * ids must be unique and stable, because sessions store them.
 */

export const FREE_TALK_LEVELS = ["a2_b1", "b2", "c1"] as const;
export type FreeTalkLevel = (typeof FREE_TALK_LEVELS)[number];

export type FreeTalkQuestion = {
  id: string;
  level: FreeTalkLevel;
  text: string;
};

export type FreeTalkTopic = {
  id: string;
  title: string;
  questions: FreeTalkQuestion[];
};

function topic(id: string, title: string, byLevel: Record<FreeTalkLevel, string[]>): FreeTalkTopic {
  return {
    id,
    title,
    questions: FREE_TALK_LEVELS.flatMap((level) =>
      byLevel[level].map((text, index) => ({ id: `${id}.${level}.${index + 1}`, level, text })),
    ),
  };
}

export const FREE_TALK_TOPICS: FreeTalkTopic[] = [
  topic("daily-life", "Daily life", {
    a2_b1: ["What does a normal day look like for you?", "What is your favourite part of the day?"],
    b2: [
      "If you could change one thing about your daily routine, what would it be?",
      "Do routines make life easier or more boring?",
    ],
    c1: [
      "To what extent do our habits shape who we become?",
      "Is a busy life a sign of success, or a problem we should fix?",
    ],
  }),
  topic("food-cooking", "Food and cooking", {
    a2_b1: ["What did you eat for breakfast today?", "Which dish can you cook well?"],
    b2: [
      "How is the food you grew up with different from what young people eat now?",
      "Would you rather eat at home or at a restaurant? Why?",
    ],
    c1: [
      "Should governments do more to influence what people eat?",
      "What does a country's food tell you about its history?",
    ],
  }),
  topic("travel", "Travel", {
    a2_b1: ["Where would you like to go on holiday?", "Do you prefer travelling by bus or by train?"],
    b2: [
      "What is the most interesting place you have ever visited?",
      "What should a tourist visiting Uzbekistan definitely see?",
    ],
    c1: [
      "Does travelling really change the way people think?",
      "How can tourism help a city without hurting the people who live there?",
    ],
  }),
  topic("technology", "Technology", {
    a2_b1: ["What do you use your phone for most?", "Which app could you not live without?"],
    b2: [
      "Has technology made it easier or harder to stay in touch with friends?",
      "What technology will change our lives most in the next ten years?",
    ],
    c1: [
      "Who should be responsible for the harm social media can cause?",
      "Will artificial intelligence create more jobs than it replaces?",
    ],
  }),
  topic("learning", "Learning and school", {
    a2_b1: ["What was your favourite subject at school?", "Why are you learning English?"],
    b2: ["What makes a teacher really good?", "Is it better to study alone or in a group?"],
    c1: ["Should university be free for everyone?", "Do exams measure what students really know?"],
  }),
  topic("friends-family", "Friends and family", {
    a2_b1: ["Who do you spend most of your weekends with?", "Tell me about your best friend."],
    b2: [
      "How have relationships between parents and children changed?",
      "What makes a friendship last for many years?",
    ],
    c1: [
      "Is it possible to stay close to friends who live far away?",
      "How much should family expectations influence our career choices?",
    ],
  }),
  topic("work-future", "Work and the future", {
    a2_b1: ["What job did you want when you were a child?", "Would you like to work in an office or outdoors?"],
    b2: [
      "What matters more in a job: the money or enjoying the work?",
      "Would you like to start your own business one day?",
    ],
    c1: [
      "Will the idea of a nine-to-five job still exist in twenty years?",
      "Should people be judged by their job titles?",
    ],
  }),
  topic("city-nature", "City and nature", {
    a2_b1: ["Do you live in a city or a village?", "What do you like to do outside when the weather is nice?"],
    b2: ["What would make your city a better place to live?", "Should cars be banned from city centres?"],
    c1: [
      "Is it fair to ask poorer countries to protect the environment as much as rich ones?",
      "Can individual choices really make a difference to climate change?",
    ],
  }),
];

export function findFreeTalkTopic(id: string) {
  return FREE_TALK_TOPICS.find((entry) => entry.id === id) ?? null;
}

export function findFreeTalkQuestion(id: string) {
  for (const entry of FREE_TALK_TOPICS) {
    const question = entry.questions.find((candidate) => candidate.id === id);
    if (question) return question;
  }
  return null;
}
