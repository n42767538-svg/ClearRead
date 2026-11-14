# ClearRead Android APK — Capacitor build

This package keeps the existing React + TypeScript UI and wraps the built web app
inside an Android app using Capacitor. It is not a React Native rewrite.

## Requirements

- Node.js 20 or newer (Node 22 LTS recommended)
- Android Studio (current stable)
- Android SDK installed through Android Studio
- Java 17 (Android Studio's bundled JBR is recommended)

## 1. Install dependencies

Unzip this project, open a terminal in the `clearread` folder, then run:

```bash
npm install
```

## 2. Configure the OCR backend

The photo-to-text feature uses the Express endpoint `POST /api/ocr` and Gemini.
The API key must stay on the server; do not put `GEMINI_API_KEY` in the Android
app or any `VITE_` variable.

Deploy the included `server.ts` backend to a public HTTPS host and configure
`GEMINI_API_KEY` there. Then create `.env.production` in this project:

```env
VITE_API_BASE_URL=https://YOUR-BACKEND-DOMAIN
```

Do not include a trailing slash. If you omit this setting, the Android app will
try `/api/ocr` on its local WebView origin and OCR will fail.

The backend must allow requests from the app and accept JSON bodies up to the
image size used by the app. Add suitable rate limiting and authentication before
a public production launch; do not expose an unrestricted Gemini proxy.

## 3. Generate the Android project

Run these commands once:

```bash
npx cap add android
```

Then build and copy the web app into Android:

```bash
npm run build
npx cap sync android
```

## 4. Open Android Studio and build the APK

```bash
npx cap open android
```

In Android Studio, wait for Gradle sync to finish, then choose:

**Build → Build Bundle(s) / APK(s) → Build APK(s)**

For a signed release APK, use:

**Build → Generate Signed Bundle / APK → APK**

Keep the signing keystore and passwords private and backed up.

## 5. Where the APK is saved

A debug APK is normally created at:

`android/app/build/outputs/apk/debug/app-debug.apk`

A signed release APK is normally created under:

`android/app/build/outputs/apk/release/`

## Important feature checks

- **Camera:** the current magnifier uses browser camera APIs (`getUserMedia`).
  Test on a real Android device and grant camera permission. If Android does not
  show the permission prompt, add/verify CAMERA permission in
  `android/app/src/main/AndroidManifest.xml` and request it at runtime.
- **Read aloud:** the app uses the Web Speech API. Android WebView/device voice
  availability varies; test English voices and playback controls on the target
  phones. Native text-to-speech may be needed for wider device compatibility.
- **Display settings:** the existing settings screen uses an Android intent URI.
  Verify this button on a real device.
- **Pro unlock:** the current `localStorage` flag is only a demo unlock. It is
  not Google Play Billing and must not be treated as a real paid entitlement.
- **Offline use:** the main UI is bundled, but OCR requires the deployed backend
  and an internet connection.

## Troubleshooting

- If TypeScript reports errors, run `npm run lint` to see them.
- After changing web assets or Capacitor plugins, run `npx cap sync android`.
- If Android Studio reports SDK/Gradle issues, install the suggested SDK
  platform/build tools in SDK Manager and sync again.


## Build APK using only an Android phone (GitHub Actions)

This project includes `.github/workflows/build-android.yml`. After the project
files are uploaded to a GitHub repository on the `main` branch, GitHub Actions
can build a debug APK in the cloud.

1. In GitHub, create a new repository.
2. Upload the extracted project contents (not the ZIP file) to the repository
   root. Keep the `.github/workflows/build-android.yml` path intact.
3. Open the repository's **Actions** tab and enable Actions if prompted.
4. Select **Build ClearRead Android APK**, tap **Run workflow**, select `main`,
   and tap **Run workflow** again.
5. Open the running workflow. Wait for the green check mark.
6. Under **Artifacts**, download `ClearRead-debug-apk`. Extract the downloaded
   artifact ZIP; it contains `app-debug.apk`.
7. Open the APK on your phone and allow installation from that source if Android
   asks. Install only the APK built from your own repository.

GitHub's free usage limits and account verification requirements can change.
If GitHub asks for payment details or a billing setup, stop and check the
current plan limits before proceeding.

Note: this produces a debug APK for personal testing, not a Play Store signed
release. The OCR API still needs a publicly reachable HTTPS backend and a
configured `VITE_API_BASE_URL`; otherwise photo OCR will not work in the APK.
