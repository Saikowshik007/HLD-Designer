import type { SystemDesignTopic } from '@/types';

export const systemDesignTopics: SystemDesignTopic[] = [
  {
    id: 'requirements',
    title: 'Requirements Gathering',
    description: 'Understanding functional and non-functional requirements',
    category: 'requirements',
    questions: [
      'What are the functional requirements of the system?',
      'What are the non-functional requirements (scalability, availability, latency)?',
      'What is the expected traffic volume (DAU, QPS)?',
      'What is the expected data volume?',
      'What are the critical user flows?',
    ],
  },
  {
    id: 'architecture',
    title: 'System Architecture',
    description: 'High-level system design and component architecture',
    category: 'architecture',
    questions: [
      'What is the high-level architecture of the system?',
      'What are the main components and their responsibilities?',
      'How do components communicate with each other?',
      'What architectural patterns are you using (microservices, monolith, etc.)?',
      'How will you handle service discovery?',
    ],
  },
  {
    id: 'scaling',
    title: 'Scalability & Performance',
    description: 'Strategies for scaling and performance optimization',
    category: 'scaling',
    questions: [
      'How will the system scale horizontally?',
      'What caching strategies will you use?',
      'How will you handle load balancing?',
      'What are the performance bottlenecks?',
      'How will you handle database scaling (sharding, replication)?',
    ],
  },
  {
    id: 'data',
    title: 'Data Management',
    description: 'Database design, storage, and data flow',
    category: 'data',
    questions: [
      'What database(s) will you use and why?',
      'What is the data model/schema?',
      'How will you ensure data consistency?',
      'What is your data backup and recovery strategy?',
      'How will you handle data partitioning?',
    ],
  },
  {
    id: 'api',
    title: 'API Design',
    description: 'API endpoints, protocols, and communication',
    category: 'api',
    questions: [
      'What APIs will the system expose?',
      'What API protocol will you use (REST, GraphQL, gRPC)?',
      'How will you handle API versioning?',
      'What is your rate limiting strategy?',
      'How will you ensure API security?',
    ],
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    description: 'Authentication, authorization, and data protection',
    category: 'security',
    questions: [
      'How will you handle authentication and authorization?',
      'What encryption strategies will you use?',
      'How will you protect against common attacks (DDoS, SQL injection, etc.)?',
      'How will you ensure data privacy and compliance (GDPR, etc.)?',
      'What is your security monitoring strategy?',
    ],
  },
  {
    id: 'monitoring',
    title: 'Monitoring & Observability',
    description: 'Logging, metrics, and system health monitoring',
    category: 'monitoring',
    questions: [
      'What metrics will you track?',
      'How will you implement logging and log aggregation?',
      'What monitoring and alerting tools will you use?',
      'How will you handle distributed tracing?',
      'What is your incident response strategy?',
    ],
  },
];

export const getCategoryColor = (category: SystemDesignTopic['category']): string => {
  const colors = {
    requirements: 'bg-blue-100 text-blue-800 border-blue-300',
    architecture: 'bg-purple-100 text-purple-800 border-purple-300',
    scaling: 'bg-green-100 text-green-800 border-green-300',
    data: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    api: 'bg-pink-100 text-pink-800 border-pink-300',
    security: 'bg-red-100 text-red-800 border-red-300',
    monitoring: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  };
  return colors[category];
};
