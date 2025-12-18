export default {
  expo: {
    name: "ASMS",
    slug: "ASMS",
    scheme: "asms",
    version: "1.0.0",

    android: {
      package: "com.thientruong51.asms",
       adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#FFFFFF"
      },
      permissions: [
        "CAMERA",
        "NOTIFICATIONS"
      ]
    },

    extra: {
      // ===== BẮT BUỘC CHO EAS =====
      eas: {
        projectId: "b1abbb70-9b36-45d3-886c-2ab5794403f1"
      },

      // ===== BACKEND =====
      API_BASE_URL: process.env.API_BASE_URL,

      // ===== FIREBASE =====
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,

      // ===== CLOUDINARY =====
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET
    }
  }
};
