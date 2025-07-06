import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function Details() {
  const { name } = useLocalSearchParams();

  return (
    <>
      <Text>Details</Text>
    </>
  );
}
