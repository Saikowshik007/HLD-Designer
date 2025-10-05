export interface InterviewTopic {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  keyAreas: string[];
}

export const interviewTopics: InterviewTopic[] = [
  // Easy
  {
    id: 'url-shortener',
    title: 'Design URL Shortener like TinyURL',
    difficulty: 'easy',
    description: 'Design a service that converts long URLs into short, shareable links',
    keyAreas: ['Hashing', 'Database Design', 'Caching', 'Rate Limiting']
  },
  {
    id: 'cdn',
    title: 'Design Content Delivery Network (CDN)',
    difficulty: 'easy',
    description: 'Design a distributed network to deliver content with low latency',
    keyAreas: ['Caching', 'Geographic Distribution', 'Load Balancing']
  },
  {
    id: 'parking-garage',
    title: 'Design Parking Garage',
    difficulty: 'easy',
    description: 'Design a parking management system',
    keyAreas: ['State Management', 'Availability Tracking', 'Payment Integration']
  },
  {
    id: 'vending-machine',
    title: 'Design Vending Machine',
    difficulty: 'easy',
    description: 'Design a vending machine control system',
    keyAreas: ['State Machine', 'Inventory Management', 'Payment Processing']
  },
  {
    id: 'kv-store',
    title: 'Design Distributed Key-Value Store',
    difficulty: 'easy',
    description: 'Design a distributed key-value storage system',
    keyAreas: ['Consistent Hashing', 'Replication', 'CAP Theorem']
  },
  {
    id: 'distributed-cache',
    title: 'Design Distributed Cache',
    difficulty: 'easy',
    description: 'Design a distributed caching system',
    keyAreas: ['Cache Eviction', 'Consistency', 'Sharding']
  },
  {
    id: 'auth-system',
    title: 'Design Authentication System',
    difficulty: 'easy',
    description: 'Design a secure authentication and authorization system',
    keyAreas: ['JWT/OAuth', 'Session Management', 'Security']
  },
  {
    id: 'upi',
    title: 'Design Unified Payments Interface (UPI)',
    difficulty: 'easy',
    description: 'Design a real-time payment system',
    keyAreas: ['Transaction Processing', 'Consistency', 'Security']
  },

  // Medium
  {
    id: 'whatsapp',
    title: 'Design WhatsApp',
    difficulty: 'medium',
    description: 'Design a real-time messaging application',
    keyAreas: ['WebSocket', 'Message Queue', 'End-to-End Encryption', 'Media Storage']
  },
  {
    id: 'spotify',
    title: 'Design Spotify',
    difficulty: 'medium',
    description: 'Design a music streaming service',
    keyAreas: ['Content Delivery', 'Recommendation Engine', 'Caching', 'DRM']
  },
  {
    id: 'job-scheduler',
    title: 'Design Distributed Job Scheduler',
    difficulty: 'medium',
    description: 'Design a system to schedule and execute jobs across distributed workers',
    keyAreas: ['Queue Management', 'Priority Scheduling', 'Fault Tolerance']
  },
  {
    id: 'notification-service',
    title: 'Design a Scalable Notification Service',
    difficulty: 'medium',
    description: 'Design a service to send notifications via multiple channels',
    keyAreas: ['Message Queue', 'Fan-out', 'Rate Limiting', 'Delivery Guarantees']
  },
  {
    id: 'instagram',
    title: 'Design Instagram',
    difficulty: 'medium',
    description: 'Design a photo sharing social media platform',
    keyAreas: ['Feed Generation', 'Image Storage', 'Relationship Graph', 'Search']
  },
  {
    id: 'tinder',
    title: 'Design Tinder',
    difficulty: 'medium',
    description: 'Design a location-based dating app',
    keyAreas: ['Geospatial Indexing', 'Matching Algorithm', 'Real-time Chat']
  },
  {
    id: 'facebook',
    title: 'Design Facebook',
    difficulty: 'medium',
    description: 'Design a social networking platform',
    keyAreas: ['News Feed', 'Social Graph', 'Notifications', 'Scalability']
  },
  {
    id: 'twitter',
    title: 'Design Twitter',
    difficulty: 'medium',
    description: 'Design a microblogging platform',
    keyAreas: ['Timeline Generation', 'Fan-out', 'Trends', 'Search']
  },
  {
    id: 'reddit',
    title: 'Design Reddit',
    difficulty: 'medium',
    description: 'Design a community-based discussion platform',
    keyAreas: ['Voting System', 'Ranking Algorithm', 'Subreddit Management']
  },
  {
    id: 'netflix',
    title: 'Design Netflix',
    difficulty: 'medium',
    description: 'Design a video streaming platform',
    keyAreas: ['Video Encoding', 'CDN', 'Recommendation', 'Adaptive Bitrate']
  },
  {
    id: 'youtube',
    title: 'Design Youtube',
    difficulty: 'medium',
    description: 'Design a video sharing and streaming platform',
    keyAreas: ['Video Processing', 'Storage', 'Recommendation', 'Comments']
  },
  {
    id: 'google-search',
    title: 'Design Google Search',
    difficulty: 'medium',
    description: 'Design a web search engine',
    keyAreas: ['Crawler', 'Indexing', 'Ranking', 'Distributed Search']
  },
  {
    id: 'ecommerce',
    title: 'Design E-commerce Store like Amazon',
    difficulty: 'medium',
    description: 'Design a large-scale e-commerce platform',
    keyAreas: ['Inventory Management', 'Order Processing', 'Search', 'Payments']
  },
  {
    id: 'tiktok',
    title: 'Design TikTok',
    difficulty: 'medium',
    description: 'Design a short-form video platform',
    keyAreas: ['Video Feed', 'Recommendation', 'Video Processing', 'Engagement']
  },
  {
    id: 'shopify',
    title: 'Design Shopify',
    difficulty: 'medium',
    description: 'Design a multi-tenant e-commerce platform',
    keyAreas: ['Multi-tenancy', 'Customization', 'Scalability', 'APIs']
  },
  {
    id: 'airbnb',
    title: 'Design Airbnb',
    difficulty: 'medium',
    description: 'Design a vacation rental marketplace',
    keyAreas: ['Search & Filters', 'Booking System', 'Pricing', 'Reviews']
  },
  {
    id: 'autocomplete',
    title: 'Design Autocomplete for Search Engines',
    difficulty: 'medium',
    description: 'Design a typeahead suggestion system',
    keyAreas: ['Trie Data Structure', 'Caching', 'Ranking', 'Real-time Updates']
  },
  {
    id: 'rate-limiter',
    title: 'Design Rate Limiter',
    difficulty: 'medium',
    description: 'Design a distributed rate limiting system',
    keyAreas: ['Token Bucket', 'Sliding Window', 'Distributed Coordination']
  },
  {
    id: 'message-queue',
    title: 'Design Distributed Message Queue like Kafka',
    difficulty: 'medium',
    description: 'Design a distributed message streaming platform',
    keyAreas: ['Partitioning', 'Replication', 'Exactly-once Delivery', 'Offset Management']
  },
  {
    id: 'flight-booking',
    title: 'Design Flight Booking System',
    difficulty: 'medium',
    description: 'Design a flight reservation and booking system',
    keyAreas: ['Inventory Management', 'Concurrency', 'Pricing', 'Seat Selection']
  },
  {
    id: 'code-editor',
    title: 'Design Online Code Editor',
    difficulty: 'medium',
    description: 'Design a collaborative online code editor',
    keyAreas: ['Real-time Collaboration', 'Operational Transform', 'Code Execution']
  },
  {
    id: 'analytics-platform',
    title: 'Design an Analytics Platform (Metrics & Logging)',
    difficulty: 'medium',
    description: 'Design a system to collect and analyze metrics and logs',
    keyAreas: ['Time-series DB', 'Aggregation', 'Visualization', 'Storage Optimization']
  },
  {
    id: 'payment-system',
    title: 'Design Payment System',
    difficulty: 'medium',
    description: 'Design a payment processing system',
    keyAreas: ['Transaction Processing', 'Idempotency', 'Reconciliation', 'Security']
  },
  {
    id: 'digital-wallet',
    title: 'Design a Digital Wallet',
    difficulty: 'medium',
    description: 'Design a digital wallet for storing and transferring money',
    keyAreas: ['Account Management', 'Transactions', 'Security', 'Compliance']
  },

  // Hard
  {
    id: 'yelp',
    title: 'Design Location Based Service like Yelp',
    difficulty: 'hard',
    description: 'Design a location-based business discovery platform',
    keyAreas: ['Geospatial Indexing', 'Search & Ranking', 'Reviews', 'Real-time Updates']
  },
  {
    id: 'uber',
    title: 'Design Uber',
    difficulty: 'hard',
    description: 'Design a ride-hailing platform',
    keyAreas: ['Matching Algorithm', 'Real-time Location', 'Pricing', 'ETA Calculation']
  },
  {
    id: 'food-delivery',
    title: 'Design Food Delivery App like Doordash',
    difficulty: 'hard',
    description: 'Design a food delivery marketplace',
    keyAreas: ['Order Management', 'Routing Optimization', 'Real-time Tracking', 'Multi-party System']
  },
  {
    id: 'google-docs',
    title: 'Design Google Docs',
    difficulty: 'hard',
    description: 'Design a collaborative document editing platform',
    keyAreas: ['Operational Transform', 'Conflict Resolution', 'Real-time Sync', 'Version Control']
  },
  {
    id: 'google-maps',
    title: 'Design Google Maps',
    difficulty: 'hard',
    description: 'Design a mapping and navigation service',
    keyAreas: ['Map Tiles', 'Routing Algorithm', 'Traffic Data', 'ETA Prediction']
  },
  {
    id: 'zoom',
    title: 'Design Zoom',
    difficulty: 'hard',
    description: 'Design a video conferencing platform',
    keyAreas: ['WebRTC', 'Media Servers', 'Scalability', 'Quality Optimization']
  },
  {
    id: 'distributed-counter',
    title: 'Design Distributed Counter',
    difficulty: 'hard',
    description: 'Design a system to count events across distributed systems',
    keyAreas: ['Eventually Consistent Counting', 'Conflict Resolution', 'Aggregation']
  },
  {
    id: 'dropbox',
    title: 'Design File Sharing System like Dropbox',
    difficulty: 'hard',
    description: 'Design a file storage and sharing platform',
    keyAreas: ['Chunking', 'Deduplication', 'Sync Algorithm', 'Version Control']
  },
  {
    id: 'bookmyshow',
    title: 'Design Ticket Booking System like BookMyShow',
    difficulty: 'hard',
    description: 'Design a movie/event ticket booking platform',
    keyAreas: ['Seat Reservation', 'Concurrency Control', 'Payment Integration', 'Inventory']
  },
  {
    id: 'web-crawler',
    title: 'Design Distributed Web Crawler',
    difficulty: 'hard',
    description: 'Design a scalable web crawling system',
    keyAreas: ['URL Frontier', 'Politeness', 'Deduplication', 'Distributed Coordination']
  },
  {
    id: 'deployment-system',
    title: 'Design Code Deployment System',
    difficulty: 'hard',
    description: 'Design a continuous deployment system',
    keyAreas: ['Blue-Green Deployment', 'Rollback', 'Health Checks', 'Orchestration']
  },
  {
    id: 's3',
    title: 'Design Distributed Cloud Storage like S3',
    difficulty: 'hard',
    description: 'Design a highly available object storage system',
    keyAreas: ['Object Storage', 'Replication', 'Durability', 'Consistency']
  },
  {
    id: 'distributed-lock',
    title: 'Design Distributed Locking Service',
    difficulty: 'hard',
    description: 'Design a distributed coordination service for locks',
    keyAreas: ['Consensus Algorithm', 'Deadlock Prevention', 'Fault Tolerance']
  },
  {
    id: 'slack',
    title: 'Design Slack',
    difficulty: 'hard',
    description: 'Design a team collaboration and messaging platform',
    keyAreas: ['Real-time Messaging', 'Channels', 'Search', 'File Sharing', 'Integrations']
  },
  {
    id: 'live-comments',
    title: 'Design Live Comments',
    difficulty: 'hard',
    description: 'Design a real-time commenting system for live events',
    keyAreas: ['Real-time Updates', 'Scalability', 'Moderation', 'WebSocket/SSE']
  }
];

export const getTopicsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
  return interviewTopics.filter(topic => topic.difficulty === difficulty);
};

export const getTopicById = (id: string) => {
  return interviewTopics.find(topic => topic.id === id);
};
