import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Create MMKV instance
const storage = new MMKV();

// Create zustand storage interface for MMKV
const mmkvStorage = {
  setItem: (name: string, value: string) => {
    return storage.set(name, value);
  },
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name: string) => {
    return storage.delete(name);
  },
};

export interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  location: string;
  details: string;
  metadata: Record<string, any>;
}

export interface UserPreference {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string;
  lastModified: string;
}

export interface SystemInfo {
  deviceId: string;
  platform: string;
  version: string;
  buildNumber: string;
  memory: number;
  storage: number;
  networkType: string;
  batteryLevel: number;
  isCharging: boolean;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface Statistics {
  totalSessions: number;
  totalTimeSpent: number;
  averageSessionLength: number;
  featuresUsed: Record<string, number>;
  dailyActivity: Record<string, number>;
  weeklyActivity: Record<string, number>;
  monthlyActivity: Record<string, number>;
  performanceMetrics: {
    appLaunchTime: number;
    screenLoadTimes: Record<string, number>;
    apiResponseTimes: Record<string, number[]>;
    errorCounts: Record<string, number>;
  };
}

export interface DetailedProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  professionalInfo: {
    jobTitle: string;
    company: string;
    department: string;
    skills: string[];
    experience: number;
    education: Array<{
      degree: string;
      institution: string;
      year: number;
      gpa: number;
    }>;
    certifications: Array<{
      name: string;
      issuer: string;
      issueDate: string;
      expiryDate: string;
    }>;
  };
  socialInfo: {
    connections: Array<{
      id: string;
      name: string;
      relationship: string;
      since: string;
    }>;
    groups: string[];
    interests: string[];
    hobbies: string[];
  };
}

export interface DetailsState {
  // Main data
  profile: DetailedProfile | null;
  activityLogs: ActivityLog[];
  preferences: UserPreference[];
  systemInfo: SystemInfo | null;
  statistics: Statistics | null;

  // Large datasets for benchmarking
  largeDataset: Array<{
    id: string;
    data: Record<string, any>;
    timestamp: string;
  }>;

  // Loading states
  isLoading: boolean;
  lastUpdated: string | null;

  // Actions
  setProfile: (profile: DetailedProfile) => void;
  addActivityLog: (log: ActivityLog) => void;
  updatePreference: (preference: UserPreference) => void;
  setSystemInfo: (info: SystemInfo) => void;
  updateStatistics: (stats: Statistics) => void;
  generateLargeDataset: (size: number) => void;
  refreshAllData: () => void;
  clearAllData: () => void;
  setLoading: (loading: boolean) => void;

  // Benchmark helpers
  benchmarkWrite: () => Promise<number>;
  benchmarkRead: () => Promise<number>;
}

// Helper function to generate realistic fake data
const generateFakeData = () => {
  const firstNames = [
    'John',
    'Jane',
    'Michael',
    'Emily',
    'David',
    'Sarah',
    'Chris',
    'Lisa',
    'Mark',
    'Anna',
  ];
  const lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
  ];
  const companies = [
    'TechCorp',
    'InnovateLLC',
    'DataSystems',
    'CloudWorks',
    'WebSolutions',
    'MobileTech',
    'AI Industries',
    'CodeFactory',
  ];
  const skills = [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Python',
    'Java',
    'Swift',
    'Kotlin',
    'Go',
    'Rust',
    'Docker',
    'AWS',
    'GraphQL',
  ];
  const cities = [
    'New York',
    'Los Angeles',
    'Chicago',
    'Houston',
    'Phoenix',
    'Philadelphia',
    'San Antonio',
    'San Diego',
    'Dallas',
    'San Jose',
  ];

  return {
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    company: companies[Math.floor(Math.random() * companies.length)],
    skill: skills[Math.floor(Math.random() * skills.length)],
    city: cities[Math.floor(Math.random() * cities.length)],
  };
};

export const useDetailsStore = create<DetailsState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      activityLogs: [],
      preferences: [],
      systemInfo: null,
      statistics: null,
      largeDataset: [],
      isLoading: false,
      lastUpdated: null,

      // Actions
      setProfile: (profile) => {
        set({ profile, lastUpdated: new Date().toISOString() });
      },

      addActivityLog: (log) => {
        set((state) => ({
          activityLogs: [log, ...state.activityLogs].slice(0, 1000), // Keep last 1000 logs
          lastUpdated: new Date().toISOString(),
        }));
      },

      updatePreference: (preference) => {
        set((state) => {
          const existingIndex = state.preferences.findIndex((p) => p.id === preference.id);
          const newPreferences = [...state.preferences];

          if (existingIndex >= 0) {
            newPreferences[existingIndex] = preference;
          } else {
            newPreferences.push(preference);
          }

          return {
            preferences: newPreferences,
            lastUpdated: new Date().toISOString(),
          };
        });
      },

      setSystemInfo: (info) => {
        set({ systemInfo: info, lastUpdated: new Date().toISOString() });
      },

      updateStatistics: (stats) => {
        set({ statistics: stats, lastUpdated: new Date().toISOString() });
      },

      generateLargeDataset: (size) => {
        const dataset = [];
        for (let i = 0; i < size; i++) {
          const fakeData = generateFakeData();
          dataset.push({
            id: `item_${i}`,
            data: {
              ...fakeData,
              randomNumber: Math.random() * 10000,
              timestamp: new Date(
                Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
              ).toISOString(),
              metadata: {
                processed: Math.random() > 0.5,
                priority: Math.floor(Math.random() * 5) + 1,
                tags: Array.from(
                  { length: Math.floor(Math.random() * 5) + 1 },
                  (_, i) => `tag_${i}`
                ),
                nestedObject: {
                  level1: {
                    level2: {
                      level3: {
                        deepValue: `deep_value_${i}`,
                        moreData: Array.from({ length: 10 }, (_, j) => ({
                          key: j,
                          value: Math.random(),
                        })),
                      },
                    },
                  },
                },
              },
            },
            timestamp: new Date().toISOString(),
          });
        }
        set({ largeDataset: dataset, lastUpdated: new Date().toISOString() });
      },

      refreshAllData: () => {
        set({ isLoading: true });

        // Simulate data refresh with realistic data
        const fakeData = generateFakeData();

        const profile: DetailedProfile = {
          personalInfo: {
            firstName: fakeData.firstName,
            lastName: fakeData.lastName,
            email: `${fakeData.firstName.toLowerCase()}.${fakeData.lastName.toLowerCase()}@email.com`,
            phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            dateOfBirth: new Date(
              1990 + Math.floor(Math.random() * 25),
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1
            )
              .toISOString()
              .split('T')[0],
            address: {
              street: `${Math.floor(Math.random() * 9999) + 1} Main St`,
              city: fakeData.city,
              state: 'CA',
              country: 'USA',
              zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
            },
            emergencyContact: {
              name: `${generateFakeData().firstName} ${generateFakeData().lastName}`,
              phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
              relationship: 'Spouse',
            },
          },
          professionalInfo: {
            jobTitle: 'Senior Software Engineer',
            company: fakeData.company,
            department: 'Engineering',
            skills: Array.from(
              { length: Math.floor(Math.random() * 8) + 3 },
              () => generateFakeData().skill
            ),
            experience: Math.floor(Math.random() * 15) + 1,
            education: [
              {
                degree: 'Bachelor of Science in Computer Science',
                institution: 'Tech University',
                year: 2018,
                gpa: 3.5 + Math.random() * 0.5,
              },
              {
                degree: 'Master of Science in Software Engineering',
                institution: 'Advanced Tech Institute',
                year: 2020,
                gpa: 3.7 + Math.random() * 0.3,
              },
            ],
            certifications: [
              {
                name: 'AWS Certified Solutions Architect',
                issuer: 'Amazon Web Services',
                issueDate: '2022-01-15',
                expiryDate: '2025-01-15',
              },
              {
                name: 'Google Cloud Professional',
                issuer: 'Google Cloud',
                issueDate: '2021-06-20',
                expiryDate: '2024-06-20',
              },
            ],
          },
          socialInfo: {
            connections: Array.from({ length: Math.floor(Math.random() * 20) + 5 }, (_, i) => {
              const connectionData = generateFakeData();
              return {
                id: `conn_${i}`,
                name: `${connectionData.firstName} ${connectionData.lastName}`,
                relationship: ['Colleague', 'Friend', 'Mentor', 'Client'][
                  Math.floor(Math.random() * 4)
                ],
                since: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
              };
            }),
            groups: [
              'React Developers',
              'TypeScript Community',
              'Mobile Development',
              'Open Source Contributors',
            ],
            interests: [
              'Technology',
              'Programming',
              'AI/ML',
              'Cloud Computing',
              'Mobile Development',
            ],
            hobbies: ['Coding', 'Reading', 'Gaming', 'Photography', 'Hiking'],
          },
        };

        const activityLogs: ActivityLog[] = Array.from({ length: 100 }, (_, i) => ({
          id: `log_${i}`,
          action: ['Login', 'Page View', 'Feature Use', 'Settings Change', 'Data Export'][
            Math.floor(Math.random() * 5)
          ],
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          location: fakeData.city,
          details: `User performed action ${i}`,
          metadata: {
            userAgent: 'Mobile App',
            version: '1.0.0',
            sessionId: `session_${Math.floor(Math.random() * 1000)}`,
          },
        }));

        const preferences: UserPreference[] = [
          {
            id: 'theme',
            category: 'Appearance',
            key: 'theme',
            value: 'dark',
            description: 'App theme preference',
            lastModified: new Date().toISOString(),
          },
          {
            id: 'notifications',
            category: 'Notifications',
            key: 'push_enabled',
            value: true,
            description: 'Enable push notifications',
            lastModified: new Date().toISOString(),
          },
          {
            id: 'language',
            category: 'Localization',
            key: 'language',
            value: 'en',
            description: 'App language',
            lastModified: new Date().toISOString(),
          },
          {
            id: 'analytics',
            category: 'Privacy',
            key: 'analytics_enabled',
            value: false,
            description: 'Enable analytics tracking',
            lastModified: new Date().toISOString(),
          },
        ];

        const systemInfo: SystemInfo = {
          deviceId: `device_${Math.random().toString(36).substring(7)}`,
          platform: 'iOS',
          version: '17.2',
          buildNumber: '1.0.0',
          memory: 8192,
          storage: 128000,
          networkType: 'WiFi',
          batteryLevel: Math.floor(Math.random() * 100),
          isCharging: Math.random() > 0.5,
          location: {
            latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
            longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
            accuracy: Math.floor(Math.random() * 10) + 1,
          },
        };

        const statistics: Statistics = {
          totalSessions: Math.floor(Math.random() * 1000) + 100,
          totalTimeSpent: Math.floor(Math.random() * 100000) + 10000,
          averageSessionLength: Math.floor(Math.random() * 600) + 120,
          featuresUsed: {
            todo_list: Math.floor(Math.random() * 100),
            chat: Math.floor(Math.random() * 50),
            profile: Math.floor(Math.random() * 20),
            settings: Math.floor(Math.random() * 30),
          },
          dailyActivity: Object.fromEntries(
            Array.from({ length: 7 }, (_, i) => [
              new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              Math.floor(Math.random() * 10) + 1,
            ])
          ),
          weeklyActivity: Object.fromEntries(
            Array.from({ length: 4 }, (_, i) => [
              `week_${i + 1}`,
              Math.floor(Math.random() * 50) + 10,
            ])
          ),
          monthlyActivity: Object.fromEntries(
            Array.from({ length: 12 }, (_, i) => [
              new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
              Math.floor(Math.random() * 200) + 50,
            ])
          ),
          performanceMetrics: {
            appLaunchTime: Math.random() * 3000 + 500,
            screenLoadTimes: {
              home: Math.random() * 1000 + 200,
              profile: Math.random() * 1500 + 300,
              settings: Math.random() * 800 + 150,
              details: Math.random() * 2000 + 400,
            },
            apiResponseTimes: {
              auth: Array.from({ length: 10 }, () => Math.random() * 500 + 100),
              data: Array.from({ length: 15 }, () => Math.random() * 1000 + 200),
              upload: Array.from({ length: 5 }, () => Math.random() * 2000 + 500),
            },
            errorCounts: {
              network: Math.floor(Math.random() * 10),
              validation: Math.floor(Math.random() * 5),
              system: Math.floor(Math.random() * 3),
            },
          },
        };

        setTimeout(() => {
          set({
            profile,
            activityLogs,
            preferences,
            systemInfo,
            statistics,
            isLoading: false,
            lastUpdated: new Date().toISOString(),
          });
        }, 500);
      },

      clearAllData: () => {
        set({
          profile: null,
          activityLogs: [],
          preferences: [],
          systemInfo: null,
          statistics: null,
          largeDataset: [],
          lastUpdated: null,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      benchmarkWrite: async () => {
        const startTime = performance.now();

        // Generate test data
        const testData = {
          largeArray: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            data: generateFakeData(),
            timestamp: new Date().toISOString(),
          })),
          complexObject: {
            level1: Array.from({ length: 100 }, (_, i) => ({
              level2: Array.from({ length: 10 }, (_, j) => ({
                level3: {
                  data: `data_${i}_${j}`,
                  numbers: Array.from({ length: 50 }, () => Math.random()),
                },
              })),
            })),
          },
        };

        // Write to MMKV
        storage.set('benchmark_test', JSON.stringify(testData));

        const endTime = performance.now();
        return endTime - startTime;
      },

      benchmarkRead: async () => {
        const startTime = performance.now();

        // Read from MMKV
        const data = storage.getString('benchmark_test');
        if (data) {
          JSON.parse(data);
        }

        const endTime = performance.now();
        return endTime - startTime;
      },
    }),
    {
      name: 'details-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        profile: state.profile,
        activityLogs: state.activityLogs,
        preferences: state.preferences,
        systemInfo: state.systemInfo,
        statistics: state.statistics,
        largeDataset: state.largeDataset,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
