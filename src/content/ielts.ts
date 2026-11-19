/**
 * IELTS-style speaking content. Each Part 1 topic is a short warm-up set; each Part 2 cue card
 * carries the Part 3 discussion questions that follow it, as in the real test. Add entries
 * freely: ids must be unique and stable, because sessions store them.
 */

export type Part1Topic = {
  id: string;
  title: string;
  questions: string[];
};

export type CueCard = {
  id: string;
  prompt: string;
  points: string[];
  closing: string;
  /** Part 3: broader discussion questions on the same theme. */
  followUps: string[];
};

export const PART1_TOPICS: Part1Topic[] = [
  {
    id: "hometown",
    title: "Your hometown",
    questions: [
      "Where is your hometown?",
      "What do you like most about living there?",
      "Has your hometown changed much since you were a child?",
      "Is it a good place for young people to live? Why?",
      "Would you like to live somewhere else in the future?",
    ],
  },
  {
    id: "work-study",
    title: "Work or study",
    questions: [
      "Do you work, or are you a student?",
      "What do you enjoy most about your work or studies?",
      "Is there anything you find difficult about it?",
      "What would you like to do in the future?",
    ],
  },
  {
    id: "free-time",
    title: "Free time",
    questions: [
      "What do you usually do in your free time?",
      "Do you prefer spending free time alone or with other people?",
      "Has the way you spend your free time changed over the years?",
      "Is there a new hobby you would like to try?",
    ],
  },
  {
    id: "food",
    title: "Food",
    questions: [
      "What kind of food do you like to eat?",
      "Do you often cook at home?",
      "Is there a dish from your country that visitors should try?",
      "Have your eating habits changed recently?",
    ],
  },
  {
    id: "weather",
    title: "Weather and seasons",
    questions: [
      "What is the weather usually like where you live?",
      "Which season do you like the most? Why?",
      "Does the weather affect your mood?",
      "Do you check the weather forecast often?",
    ],
  },
  {
    id: "reading",
    title: "Reading",
    questions: [
      "Do you like reading?",
      "What kinds of things do you usually read?",
      "Do you prefer paper books or reading on a screen?",
      "Did you read a lot when you were a child?",
    ],
  },
  {
    id: "phones",
    title: "Phones and the internet",
    questions: [
      "How much time do you spend on your phone each day?",
      "Which app do you use the most?",
      "Do you think you spend too much time online?",
      "Is there any technology you couldn't live without?",
    ],
  },
  {
    id: "music",
    title: "Music",
    questions: [
      "What kind of music do you enjoy?",
      "When do you usually listen to music?",
      "Have you ever learned to play an instrument?",
      "Is music popular with young people in your country?",
    ],
  },
  {
    id: "getting-around",
    title: "Getting around",
    questions: [
      "How do you usually travel around your city?",
      "Do you enjoy visiting new places?",
      "Tell me about the last trip you took.",
      "Would you rather travel by train or by plane?",
    ],
  },
  {
    id: "friends",
    title: "Friends",
    questions: [
      "Do you have many close friends?",
      "How often do you meet your friends?",
      "What do you usually do together?",
      "Is it easy to make new friends as an adult?",
    ],
  },
];

/** The fixed line printed on every Part 2 card above its points. */
export const CUE_CARD_LEAD = "You should say:";

export const CUE_CARDS: CueCard[] = [
  {
    id: "person-admire",
    prompt: "Describe a person you admire.",
    points: ["who this person is", "how you know them", "what they have done"],
    closing: "and explain why you admire this person.",
    followUps: [
      "What qualities make someone a good role model?",
      "Do young people today admire different people than their parents did?",
      "How do celebrities influence young people?",
      "Is it important for children to have role models?",
      "Should famous people be careful about how they behave in public?",
    ],
  },
  {
    id: "memorable-trip",
    prompt: "Describe a trip that you remember well.",
    points: ["where you went", "who you went with", "what you did there"],
    closing: "and explain why it was memorable.",
    followUps: [
      "Why do people like to travel?",
      "How has tourism changed in your country?",
      "What are the disadvantages of tourism for local people?",
      "Is it better to travel alone or with others?",
      "Will people travel more or less in the future?",
    ],
  },
  {
    id: "difficult-skill",
    prompt: "Describe a skill you learned that was difficult at first.",
    points: ["what the skill is", "when and how you learned it", "what was difficult about it"],
    closing: "and explain how you feel about it now.",
    followUps: [
      "Which skills are most useful for young people today?",
      "Is it better to learn from a teacher or to teach yourself?",
      "Why do some people give up learning new things?",
      "Do schools teach enough practical skills?",
      "How has the internet changed the way people learn?",
    ],
  },
  {
    id: "everyday-object",
    prompt: "Describe an object you use every day.",
    points: ["what it is", "when you got it", "how you use it"],
    closing: "and explain why it is important to you.",
    followUps: [
      "Do people buy too many things nowadays?",
      "Why do people like to buy the newest products?",
      "How has advertising changed what people buy?",
      "Is it better to repair things or to buy new ones?",
      "What everyday objects might disappear in the future?",
    ],
  },
  {
    id: "book-or-film",
    prompt: "Describe a book or a film that made you think.",
    points: ["what it was", "when you read or watched it", "what it was about"],
    closing: "and explain why it made you think.",
    followUps: [
      "Do people read less than they used to?",
      "What can films teach us that books cannot?",
      "Should children's screen time be limited?",
      "Why are some stories popular all over the world?",
      "Will books still be printed in the future?",
    ],
  },
  {
    id: "celebration",
    prompt: "Describe a celebration you enjoyed.",
    points: ["what the celebration was", "where it took place", "who was there"],
    closing: "and explain why you enjoyed it.",
    followUps: [
      "Why are celebrations important in a culture?",
      "How have family celebrations changed in recent years?",
      "Do people spend too much money on celebrations?",
      "Are traditional festivals still popular with young people?",
      "What can people learn from other countries' celebrations?",
    ],
  },
  {
    id: "place-to-relax",
    prompt: "Describe a place where you like to relax.",
    points: ["where it is", "how often you go there", "what you do there"],
    closing: "and explain why it helps you relax.",
    followUps: [
      "Why do people find it hard to relax today?",
      "Are there enough green spaces in cities?",
      "Should employers help workers deal with stress?",
      "Is it better to relax at home or to go out?",
      "How do older and younger people relax differently?",
    ],
  },
  {
    id: "future-goal",
    prompt: "Describe a goal you would like to achieve.",
    points: ["what the goal is", "when you decided on it", "what you need to do to achieve it"],
    closing: "and explain why it matters to you.",
    followUps: [
      "Why do some people achieve their goals while others do not?",
      "Should parents set goals for their children?",
      "Is it important to have long-term plans?",
      "How does success change people?",
      "Do people today feel more pressure to succeed?",
    ],
  },
];

export function findPart1Topic(id: string) {
  return PART1_TOPICS.find((topic) => topic.id === id) ?? null;
}

export function findCueCard(id: string | null) {
  return CUE_CARDS.find((card) => card.id === id) ?? null;
}
