import { Stack } from 'expo-router';

export default function SalesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="quick-sale" />
      <Stack.Screen name="wholesale" />
    </Stack>
  );
}
