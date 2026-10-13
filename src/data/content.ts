import type { Domain } from '@/types';

export const DOMAINS: Domain[] = [
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    description: 'Machine learning, NLP, computer vision, and intelligent systems that reshape how we interact with technology.',
    icon: 'cpu',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical technology, diagnostics, telemedicine, and solutions that improve patient outcomes and accessibility.',
    icon: 'activity',
  },
  {
    id: 'environment',
    name: 'Environment & Greenery',
    description: 'Sustainability, waste management, renewable energy, and ecological innovations for a greener future.',
    icon: 'leaf',
  },
  {
    id: 'fintech',
    name: 'Finance / FinTech',
    description: 'Digital payments, blockchain, investment tools, and financial inclusion platforms for the modern economy.',
    icon: 'trending-up',
  },
  {
    id: 'other',
    name: 'Other Innovations',
    description: 'Any breakthrough concept that does not fit the above categories but demonstrates genuine innovation.',
    icon: 'lightbulb',
  },
];

export const ACADEMIC_YEDS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export const FAQS = [
  {
    question: 'Who can participate?',
    answer: 'Any current student can participate in the CodezY Startup Pitch. Simply register with your academic details and your startup idea.',
  },
  {
    question: 'Can I register individually?',
    answer: 'Yes. You can choose Solo participation and submit your idea with a single participant form.',
  },
  {
    question: 'Can I participate with a teammate?',
    answer: 'Yes. Choose Duo participation to register as a team of two. Both members must provide their complete details.',
  },
  {
    question: 'Is a working prototype compulsory?',
    answer: 'No. A working prototype is not compulsory. You must specify whether a prototype is available at the time of registration.',
  },
  {
    question: 'Can I upload a sketch?',
    answer: 'Yes. An optional sketch or blueprint upload is available. You can share an image or PDF of your concept.',
  },
  {
    question: 'How will presentation dates be communicated?',
    answer: 'Presentation details and schedules will be communicated through the official WhatsApp group after registration.',
  },
];

export const BENEFITS = [
  {
    icon: 'presentation',
    title: 'Showcase Your Ideas',
    description: 'Present your startup vision to an audience and get your concept in front of people who matter.',
  },
  {
    icon: 'search',
    title: 'Explore Real-World Problems',
    description: 'Identify pressing challenges across industries and build solutions that create genuine impact.',
  },
  {
    icon: 'rocket',
    title: 'Develop Entrepreneurial Thinking',
    description: 'Learn to think like a founder — validate ideas, understand users, and build with purpose.',
  },
  {
    icon: 'lightbulb',
    title: 'Present Innovative Solutions',
    description: 'Pitch creative, technology-driven solutions and sharpen your ability to communicate vision.',
  },
];

export const GUIDELINES = [
  'Participation is open as Solo or Duo — maximum two members per team.',
  'Complete participant details are required for every team member.',
  'You must specify whether a working prototype is available.',
  'Uploading a sketch or blueprint is optional but encouraged.',
  'Presentation details will be communicated through WhatsApp.',
];

export const IMPORTANT_DATES = [
  { label: 'Registration Opens', date: 'To Be Announced' },
  { label: 'Registration Deadline', date: 'To Be Announced' },
  { label: 'Shortlist Announcement', date: 'To Be Announced' },
  { label: 'Presentation Day', date: 'To Be Announced' },
];
