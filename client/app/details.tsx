import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDetailsStore } from '../store/detailsStore';

interface BenchmarkResult {
  writeTime: number;
  readTime: number;
  timestamp: string;
}

export default function Details() {
  const { name } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [runningBenchmark, setRunningBenchmark] = useState(false);

  const {
    profile,
    activityLogs,
    preferences,
    systemInfo,
    statistics,
    largeDataset,
    isLoading,
    lastUpdated,
    refreshAllData,
    generateLargeDataset,
    clearAllData,
    benchmarkWrite,
    benchmarkRead,
  } = useDetailsStore();

  useEffect(() => {
    // Load initial data if not present
    if (!profile && !isLoading) {
      refreshAllData();
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    refreshAllData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const runBenchmark = async () => {
    setRunningBenchmark(true);
    try {
      const writeTime = await benchmarkWrite();
      const readTime = await benchmarkRead();

      const result: BenchmarkResult = {
        writeTime,
        readTime,
        timestamp: new Date().toISOString(),
      };

      setBenchmarkResults((prev) => [result, ...prev].slice(0, 10)); // Keep last 10 results

      Alert.alert(
        'Benchmark Complete',
        `Write: ${writeTime.toFixed(2)}ms\nRead: ${readTime.toFixed(2)}ms`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Benchmark Error', 'Failed to run benchmark');
    } finally {
      setRunningBenchmark(false);
    }
  };

  const generateTestData = (size: number) => {
    generateLargeDataset(size);
    Alert.alert('Data Generated', `Generated ${size} test items`);
  };

  if (isLoading && !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading detailed information...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Header */}
      <View className="bg-blue-600 px-6 py-8">
        <Text className="text-3xl font-bold text-white">Details Dashboard</Text>
        <Text className="mt-2 text-blue-100">Comprehensive user data and system information</Text>
        {lastUpdated && (
          <Text className="mt-2 text-sm text-blue-200">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View className="m-4 rounded-lg bg-white p-4 shadow-sm">
        <Text className="mb-4 text-lg font-semibold text-gray-800">Quick Actions</Text>
        <View className="flex-row flex-wrap gap-2">
          <TouchableOpacity
            onPress={refreshAllData}
            disabled={isLoading}
            className="rounded-lg bg-blue-500 px-4 py-2">
            <Text className="font-medium text-white">
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={runBenchmark}
            disabled={runningBenchmark}
            className="rounded-lg bg-green-500 px-4 py-2">
            <Text className="font-medium text-white">
              {runningBenchmark ? 'Running...' : 'Run Benchmark'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => generateTestData(500)}
            className="rounded-lg bg-purple-500 px-4 py-2">
            <Text className="font-medium text-white">Generate 500 Items</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => generateTestData(1000)}
            className="rounded-lg bg-purple-600 px-4 py-2">
            <Text className="font-medium text-white">Generate 1000 Items</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={clearAllData} className="rounded-lg bg-red-500 px-4 py-2">
            <Text className="font-medium text-white">Clear All Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Benchmark Results */}
      {benchmarkResults.length > 0 && (
        <View className="m-4 rounded-lg bg-white p-4 shadow-sm">
          <Text className="mb-4 text-lg font-semibold text-gray-800">MMKV Benchmark Results</Text>
          {benchmarkResults.map((result, index) => (
            <View key={index} className="border-b border-gray-100 py-2">
              <Text className="text-sm text-gray-600">
                {new Date(result.timestamp).toLocaleString()}
              </Text>
              <Text className="text-sm">
                Write: {result.writeTime.toFixed(2)}ms | Read: {result.readTime.toFixed(2)}ms
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Profile Information */}
      {profile && (
        <View className="m-4 rounded-lg bg-white p-4 shadow-sm">
          <Text className="mb-4 text-lg font-semibold text-gray-800">Personal Profile</Text>

          <View className="mb-4">
            <Text className="text-md mb-2 font-medium text-gray-700">Personal Information</Text>
            <View className="rounded bg-gray-50 p-3">
              <Text className="text-sm">
                Name: {profile.personalInfo.firstName} {profile.personalInfo.lastName}
              </Text>
              <Text className="text-sm">Email: {profile.personalInfo.email}</Text>
              <Text className="text-sm">Phone: {profile.personalInfo.phone}</Text>
              <Text className="text-sm">DOB: {profile.personalInfo.dateOfBirth}</Text>
              <Text className="text-sm">
                Address: {profile.personalInfo.address.street}, {profile.personalInfo.address.city},{' '}
                {profile.personalInfo.address.state} {profile.personalInfo.address.zipCode}
              </Text>
              <Text className="text-sm">
                Emergency Contact: {profile.personalInfo.emergencyContact.name} (
                {profile.personalInfo.emergencyContact.relationship}) -{' '}
                {profile.personalInfo.emergencyContact.phone}
              </Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-md mb-2 font-medium text-gray-700">Professional Information</Text>
            <View className="rounded bg-gray-50 p-3">
              <Text className="text-sm">Title: {profile.professionalInfo.jobTitle}</Text>
              <Text className="text-sm">Company: {profile.professionalInfo.company}</Text>
              <Text className="text-sm">Department: {profile.professionalInfo.department}</Text>
              <Text className="text-sm">
                Experience: {profile.professionalInfo.experience} years
              </Text>
              <Text className="text-sm">Skills: {profile.professionalInfo.skills.join(', ')}</Text>

              <Text className="mt-2 text-sm font-medium">Education:</Text>
              {profile.professionalInfo.education.map((edu, index) => (
                <Text key={index} className="ml-2 text-xs">
                  • {edu.degree} from {edu.institution} ({edu.year}) - GPA: {edu.gpa.toFixed(2)}
                </Text>
              ))}

              <Text className="mt-2 text-sm font-medium">Certifications:</Text>
              {profile.professionalInfo.certifications.map((cert, index) => (
                <Text key={index} className="ml-2 text-xs">
                  • {cert.name} by {cert.issuer} (Expires: {cert.expiryDate})
                </Text>
              ))}
            </View>
          </View>

          <View>
            <Text className="text-md mb-2 font-medium text-gray-700">Social Information</Text>
            <View className="rounded bg-gray-50 p-3">
              <Text className="text-sm">Connections: {profile.socialInfo.connections.length}</Text>
              <Text className="text-sm">Groups: {profile.socialInfo.groups.join(', ')}</Text>
              <Text className="text-sm">Interests: {profile.socialInfo.interests.join(', ')}</Text>
              <Text className="text-sm">Hobbies: {profile.socialInfo.hobbies.join(', ')}</Text>

              <Text className="mt-2 text-sm font-medium">Recent Connections:</Text>
              {profile.socialInfo.connections.slice(0, 5).map((connection) => (
                <Text key={connection.id} className="ml-2 text-xs">
                  • {connection.name} ({connection.relationship}) - Since {connection.since}
                </Text>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* System Information */}
      {systemInfo && (
        <View className="m-4 rounded-lg bg-white p-4 shadow-sm">
          <Text className="mb-4 text-lg font-semibold text-gray-800">System Information</Text>
          <View className="rounded bg-gray-50 p-3">
            <Text className="text-sm">Device ID: {systemInfo.deviceId}</Text>
            <Text className="text-sm">
              Platform: {systemInfo.platform} {systemInfo.version}
            </Text>
            <Text className="text-sm">Build: {systemInfo.buildNumber}</Text>
            <Text className="text-sm">Memory: {systemInfo.memory} MB</Text>
            <Text className="text-sm">Storage: {systemInfo.storage} MB</Text>
            <Text className="text-sm">Network: {systemInfo.networkType}</Text>
            <Text className="text-sm">
              Battery: {systemInfo.batteryLevel}% {systemInfo.isCharging ? '(Charging)' : ''}
            </Text>
            <Text className="text-sm">
              Location: {systemInfo.location.latitude.toFixed(4)},{' '}
              {systemInfo.location.longitude.toFixed(4)} (±{systemInfo.location.accuracy}m)
            </Text>
          </View>
        </View>
      )}

      {/* Statistics */}
      {statistics && (
        <View className="m-4 rounded-lg bg-white p-4 shadow-sm">
          <Text className="mb-4 text-lg font-semibold text-gray-800">Usage Statistics</Text>

          <View className="mb-4">
            <Text className="text-md mb-2 font-medium text-gray-700">General Stats</Text>
            <View className="rounded bg-gray-50 p-3">
              <Text className="text-sm">Total Sessions: {statistics.totalSessions}</Text>
              <Text className="text-sm">
                Total Time: {Math.floor(statistics.totalTimeSpent / 3600)}h{' '}
                {Math.floor((statistics.totalTimeSpent % 3600) / 60)}m
              </Text>
              <Text className="text-sm">
                Avg Session: {Math.floor(statistics.averageSessionLength / 60)}m{' '}
                {statistics.averageSessionLength % 60}s
              </Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-md mb-2 font-medium text-gray-700">Features Used</Text>
            <View className="rounded bg-gray-50 p-3">
              {Object.entries(statistics.featuresUsed).map(([feature, count]) => (
                <Text key={feature} className="text-sm">
                  {feature.replace('_', ' ')}: {count} times
                </Text>
              ))}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-md mb-2 font-medium text-gray-700">Performance Metrics</Text>
            <View className="rounded bg-gray-50 p-3">
              <Text className="text-sm">
                App Launch: {statistics.performanceMetrics.appLaunchTime.toFixed(0)}ms
              </Text>

              <Text className="mt-2 text-sm font-medium">Screen Load Times:</Text>
              {Object.entries(statistics.performanceMetrics.screenLoadTimes).map(
                ([screen, time]) => (
                  <Text key={screen} className="ml-2 text-xs">
                    • {screen}: {time.toFixed(0)}ms
                  </Text>
                )
              )}

              <Text className="mt-2 text-sm font-medium">API Response Times (avg):</Text>
              {Object.entries(statistics.performanceMetrics.apiResponseTimes).map(
                ([api, times]) => (
                  <Text key={api} className="ml-2 text-xs">
                    • {api}: {(times.reduce((a, b) => a + b, 0) / times.length).toFixed(0)}ms
                  </Text>
                )
              )}

              <Text className="mt-2 text-sm font-medium">Error Counts:</Text>
              {Object.entries(statistics.performanceMetrics.errorCounts).map(([type, count]) => (
                <Text key={type} className="ml-2 text-xs">
                  • {type}: {count}
                </Text>
              ))}
            </View>
          </View>

          <View>
            <Text className="text-md mb-2 font-medium text-gray-700">Monthly Activity</Text>
            <View className="rounded bg-gray-50 p-3">
              {Object.entries(statistics.monthlyActivity).map(([month, activity]) => (
                <Text key={month} className="text-sm">
                  {month}: {activity} sessions
                </Text>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* User Preferences */}
      {preferences.length > 0 && (
        <View className="m-4 rounded-lg bg-white p-4 shadow-sm">
          <Text className="mb-4 text-lg font-semibold text-gray-800">User Preferences</Text>
          {preferences.map((pref) => (
            <View key={pref.id} className="border-b border-gray-100 py-2">
              <Text className="text-sm font-medium">
                {pref.category} - {pref.key}
              </Text>
              <Text className="text-sm text-gray-600">{pref.description}</Text>
              <Text className="text-sm">Value: {String(pref.value)}</Text>
              <Text className="text-xs text-gray-400">
                Modified: {new Date(pref.lastModified).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Activity Logs */}
      {activityLogs.length > 0 && (
        <View className="m-4 rounded-lg bg-white p-4 shadow-sm">
          <Text className="mb-4 text-lg font-semibold text-gray-800">
            Recent Activity ({activityLogs.length} logs)
          </Text>
          {activityLogs.slice(0, 20).map((log) => (
            <View key={log.id} className="border-b border-gray-100 py-2">
              <View className="flex-row justify-between">
                <Text className="text-sm font-medium">{log.action}</Text>
                <Text className="text-xs text-gray-400">
                  {new Date(log.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text className="text-sm text-gray-600">{log.details}</Text>
              <Text className="text-xs text-gray-400">Location: {log.location}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Large Dataset Info */}
      {largeDataset.length > 0 && (
        <View className="m-4 rounded-lg bg-white p-4 shadow-sm">
          <Text className="mb-4 text-lg font-semibold text-gray-800">Generated Test Dataset</Text>
          <View className="rounded bg-gray-50 p-3">
            <Text className="text-sm">Total Items: {largeDataset.length}</Text>
            <Text className="text-sm">
              Estimated Size: ~{Math.round(JSON.stringify(largeDataset).length / 1024)} KB
            </Text>
            <Text className="text-sm">Sample Item Preview:</Text>
            {largeDataset[0] && (
              <View className="ml-2 mt-1">
                <Text className="text-xs">ID: {largeDataset[0].id}</Text>
                <Text className="text-xs">
                  Name: {largeDataset[0].data.firstName} {largeDataset[0].data.lastName}
                </Text>
                <Text className="text-xs">Company: {largeDataset[0].data.company}</Text>
                <Text className="text-xs">Priority: {largeDataset[0].data.metadata?.priority}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Storage Information */}
      <View className="m-4 mb-8 rounded-lg bg-white p-4 shadow-sm">
        <Text className="mb-4 text-lg font-semibold text-gray-800">Storage Information</Text>
        <View className="rounded bg-gray-50 p-3">
          <Text className="text-sm">Storage Type: MMKV</Text>
          <Text className="text-sm">Persistence: Enabled</Text>
          <Text className="text-sm">Store Name: details-store</Text>
          <Text className="text-sm">
            Estimated Data Size: ~
            {Math.round(
              JSON.stringify({
                profile,
                activityLogs,
                preferences,
                systemInfo,
                statistics,
                largeDataset,
              }).length / 1024
            )}{' '}
            KB
          </Text>
          <Text className="mt-2 text-xs text-gray-500">
            This data is now persisted using MMKV for faster performance compared to AsyncStorage.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
