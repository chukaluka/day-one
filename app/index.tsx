import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/store/useAuthStore";

export default function Index() {
  const user = useAuthStore((state) => state.user);

  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />;
}
