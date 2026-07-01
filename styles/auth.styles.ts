import { StyleSheet } from "react-native";
import { COLORS } from "@/constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  brandSection: {
    alignItems: "center",
    marginTop: 60,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: 16,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 8,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 14,
    width: "100%",
    maxWidth: 320,
  },
  googleButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "600",
  },
});
