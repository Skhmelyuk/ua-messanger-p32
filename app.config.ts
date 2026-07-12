import { ConfigContext, ExpoConfig } from "expo/config";

// EAS налаштування (отримайте з вашого app.json або після виконання eas project:init)
const EAS_PROJECT_ID = "3137fc56-64ee-4ebc-b242-7807a4a12d0f"; // Наприклад, a84f4b6b-...
const PROJECT_SLUG = "ua-messanger-p32";
const OWNER = "skhmelyuk"; // Ваш Expo username

// Production конфігурація (базова)
const APP_NAME = "UA Messanger";
const BUNDLE_IDENTIFIER = "com.skhmelyuk.uamessangerp32";
const PACKAGE_NAME = "com.skhmelyuk.uamessangerp32";
const SCHEME = "uamessangerp32";

// Іконки
const ICON = "./assets/images/icon.png"; // Головна іконка додатка (використовується на iOS та як замовчування)
const ADAPTIVE_ICON_FOREGROUND = "./assets/images/android-icon-foreground.png"; // Передній план адаптивної іконки Android (логотип)
const ADAPTIVE_ICON_BACKGROUND = "./assets/images/android-icon-background.png"; // Задній план адаптивної іконки Android (фон)
const ADAPTIVE_ICON_MONOCHROME = "./assets/images/android-icon-monochrome.png"; // Монохромна іконка Android для тем оформлення (Android 13+)

export default ({ config }: ConfigContext): ExpoConfig => {
  const environment =
    (process.env.APP_ENV as "development" | "preview" | "production") ||
    "development";

  console.log("⚙️  Building for environment:", environment);
  console.log("📦 Convex URL:", process.env.EXPO_PUBLIC_CONVEX_URL);

  const dynamicConfig = getDynamicAppConfig(environment);

  return {
    ...config,
    name: dynamicConfig.name,
    slug: PROJECT_SLUG,
    version: "1.0.0",
    orientation: "portrait",
    icon: dynamicConfig.icon,
    scheme: dynamicConfig.scheme,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: dynamicConfig.bundleIdentifier,
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription:
          "This app uses the camera to take photos and share them in messages.",
        NSPhotoLibraryUsageDescription:
          "This app accesses your photos to share them in messages.",
      },
    },

    android: {
      package: dynamicConfig.packageName,
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: dynamicConfig.adaptiveIconForeground,
        backgroundImage: dynamicConfig.adaptiveIconBackground,
        monochromeImage: dynamicConfig.adaptiveIconMonochrome,
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.RECORD_AUDIO",
      ],
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-secure-store",
    ],

    updates: {
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    },
    runtimeVersion: {
      policy: "appVersion",
    },

    extra: {
      eas: {
        projectId: EAS_PROJECT_ID,
      },
      router: {},
    },

    owner: OWNER,
  };
};

// Функція для динамічної конфігурації
export const getDynamicAppConfig = (
  environment: "development" | "preview" | "production",
) => {
  if (environment === "development") {
    return {
      name: `${APP_NAME} Dev`,
      bundleIdentifier: `${BUNDLE_IDENTIFIER}.dev`,
      packageName: `${PACKAGE_NAME}.dev`,
      icon: "./assets/images/icons/icon-dev.png",
      adaptiveIconForeground:
        "./assets/images/icons/android-icon-foreground-dev.png",
      adaptiveIconBackground: ADAPTIVE_ICON_BACKGROUND,
      adaptiveIconMonochrome: ADAPTIVE_ICON_MONOCHROME,
      scheme: `${SCHEME}-dev`,
    };
  }

  if (environment === "preview") {
    return {
      name: `${APP_NAME} Preview`,
      bundleIdentifier: `${BUNDLE_IDENTIFIER}.preview`,
      packageName: `${PACKAGE_NAME}.preview`,
      icon: "./assets/images/icons/icon-preview.png",
      adaptiveIconForeground:
        "./assets/images/icons/android-icon-foreground-preview.png",
      adaptiveIconBackground: ADAPTIVE_ICON_BACKGROUND,
      adaptiveIconMonochrome: ADAPTIVE_ICON_MONOCHROME,
      scheme: `${SCHEME}-preview`,
    };
  }

  // Production (fallback)
  return {
    name: APP_NAME,
    bundleIdentifier: BUNDLE_IDENTIFIER,
    packageName: PACKAGE_NAME,
    icon: ICON,
    adaptiveIconForeground: ADAPTIVE_ICON_FOREGROUND,
    adaptiveIconBackground: ADAPTIVE_ICON_BACKGROUND,
    adaptiveIconMonochrome: ADAPTIVE_ICON_MONOCHROME,
    scheme: SCHEME,
  };
};
