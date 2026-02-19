# Plexo Operations - Mobile App Documentation

Flutter application for store operations management.

## Requirements

- Flutter 3.16+
- Dart 3.2+
- iOS 12+ / Android 5.0+
- Xcode 15+ (for iOS development)

## Getting Started

### Install Dependencies

```bash
cd apps/mobile
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Run the App

```bash
# List available devices
flutter devices

# Run on iOS Simulator
open -a Simulator
flutter run

# Run on specific device
flutter run -d <device_id>
```

### Build for Production

Production builds use `--dart-define=ENV=production` to point at the live API:

```bash
# Android App Bundle (for Play Store)
flutter build appbundle --release --dart-define=ENV=production

# Android APK
flutter build apk --release --dart-define=ENV=production

# iOS (for App Store / TestFlight)
flutter build ios --release --dart-define=ENV=production
```

Without `--dart-define=ENV=production`, builds default to the development API host.

## Project Structure

```
apps/mobile/lib/
├── core/
│   ├── config/           # App configuration
│   ├── constants/        # App constants
│   ├── database/         # Drift (SQLite) database
│   ├── repositories/     # Data repositories
│   ├── router/           # GoRouter configuration + route guards
│   ├── services/         # API client, notifications, sync
│   ├── theme/            # App theme and colors
│   └── utils/            # Utility helpers
├── features/
│   ├── announcements/    # HQ announcements with read receipts
│   ├── auth/             # Login/authentication
│   ├── campaigns/        # Campaign execution and photo submissions
│   ├── checklists/       # Checklists / Digital SOPs
│   ├── corrective_actions/ # CAPA management
│   ├── gamification/     # Leaderboards and badges
│   ├── home/             # Home shell (drawer navigation)
│   ├── issues/           # Issue reporting and tracking
│   ├── planograms/       # Visual merchandising planograms
│   ├── profile/          # User profile
│   ├── receiving/        # Receiving management
│   ├── store_audits/     # Store audits and inspections
│   ├── tasks/            # Daily tasks
│   ├── training/         # Training / LMS courses
│   └── verification/     # Task verification queue
└── shared/
    ├── providers/        # Shared Riverpod providers (auth, etc.)
    └── widgets/          # Reusable widgets
```

## Navigation

The app uses a **side drawer** (not bottom nav) organized in three sections, filtered by the user's module access:

- **Operaciones** — Plan del Día, Recepciones, Incidencias, Verificaciones
- **Calidad** — Checklists, Auditorías, Acciones Correctivas, Planogramas
- **Equipo** — Capacitación, Clasificación, Insignias

Profile is always visible. Routes are also protected via `GoRouter` redirect — users without module access get redirected to `/`.

Module access comes from the login response (`moduleAccess` array). Super admins (`isSuperAdmin: true`) see everything.

## Features

### Authentication
- Email/password login
- JWT token management with auto-refresh
- Secure storage for credentials
- Session persistence
- `moduleAccess` and `isSuperAdmin` stored in auth state for route/drawer filtering

### Receiving (Recepciones)

Located at: `lib/features/receiving/`

**Capabilities:**
- View list of scheduled and completed receivings
- Create new receiving with barcode scanning for PO numbers
- Start receiving (mark truck arrived)
- Report discrepancies with photos
- Complete receiving with digital signature
- Mark as "did not arrive"

**Key Files:**
- `receiving_page.dart` - Main receiving list and forms
- `receiving_card.dart` - Receiving card widget
- `receiving_provider.dart` - State management

**Barcode Scanning:**
The app uses the `mobile_scanner` package for scanning PO (Purchase Order) numbers:

```dart
// Open scanner
final scannedValue = await BarcodeScannerSheet.show(
  context,
  title: 'Escanear Número de PO',
  subtitle: 'Apunta al código de barras de la orden de compra',
);
```

### Tasks (Tareas)

Located at: `lib/features/tasks/`

- View daily task assignments
- Complete tasks with notes and photos
- Offline task completion with sync

### Issues (Incidencias)

Located at: `lib/features/issues/`

- Report store issues with categories (auto-assigns to best-fit user)
- **Recategorize** open issues — changes category and auto-reassigns to best-fit user
- 3-way view toggle: **Todas** | **Mis Reportes** | **Asignadas a Mí**
- Attach photos as evidence
- Track issue status and resolution
- WebSocket auto-refresh when an issue is assigned to you

**Key Files:**
- `issues_page.dart` - Main page with `SegmentedButton` view toggle
- `issue_card.dart` - Issue card widget (shows assignee)
- `issues_provider.dart` - State management (`IssueViewMode` enum, `loadAssignedIssues()`)
- `issue_model.dart` - Data model

### Announcements (Anuncios)

Located at: `lib/features/announcements/`

- View HQ announcements with urgent banner on home page
- Priority-based display
- Read status tracking and acknowledgement

### Checklists / Digital SOPs

Located at: `lib/features/checklists/`

- View checklists assigned to the user's store
- Submit checklist responses with photos and notes
- Track completion status per day

### Store Audits (Auditorías)

Located at: `lib/features/store_audits/`

- View scheduled audits
- Conduct audits with section-based scoring
- Report findings with photo evidence

### Corrective Actions (CAPA)

Located at: `lib/features/corrective_actions/`

- View assigned corrective actions
- Track status (pending, in progress, completed)
- Auto-created from audit findings, checklist failures, high-priority issues

### Planograms (Planogramas)

Located at: `lib/features/planograms/`

- View pending planogram templates with reference photos
- Submit implementation photos for HQ review
- Track approval status

### Campaigns (Campañas)

Located at: `lib/features/campaigns/`

- View active campaigns assigned to the user's store
- Submit campaign execution with photos and notes
- Resubmit if revision is requested by HQ
- Photo comparison between reference and submitted photos
- Track approval status (pending review, approved, needs revision)

### Training / LMS (Capacitación)

Located at: `lib/features/training/`

- Browse courses by category (Operaciones, Manejo de Caja, Inventario, etc.)
- View course detail with lessons list and progress
- Start course, complete lessons, submit quizzes
- Track enrollment status (assigned, in progress, completed)
- Gamification: course completion awards points

### Gamification

Located at: `lib/features/gamification/`

- **Leaderboard** — weekly/monthly/all-time rankings by store, region, or global
- **Badges** — earned badges and progress toward unearned ones
- Points auto-awarded for tasks, checklists, audits, issues, CAPAs, planograms, training

## State Management

The app uses **Riverpod** for state management.

### Key Providers

```dart
// Authentication state
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>(...);

// Receiving state
final receivingProvider = StateNotifierProvider<ReceivingNotifier, ReceivingState>(...);

// API client
final apiClientProvider = Provider<ApiClient>(...);
```

### Usage Example

```dart
class MyWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final receivingState = ref.watch(receivingProvider);

    if (receivingState.isLoading) {
      return CircularProgressIndicator();
    }

    return ListView.builder(
      itemCount: receivingState.receivings.length,
      itemBuilder: (context, index) {
        return ReceivingCard(receiving: receivingState.receivings[index]);
      },
    );
  }
}
```

## Offline Support

The app uses **Drift** (SQLite) for local data storage and offline support.

**Database Tables:**
- `receivings` - Cached receiving records
- `tasks` - Task assignments
- `sync_queue` - Pending sync operations

**Sync Strategy:**
1. Data is cached locally when fetched from API
2. Changes made offline are queued in `sync_queue`
3. When connectivity is restored, queued changes are synced
4. Conflicts are resolved with server-wins strategy

**API Response Cache (all modules):**

In addition to Drift tables for tasks/receivings/issues, the `ApiClient` has a lightweight response cache that stores the last successful GET response per URL path in SharedPreferences. On network failure, cached data (< 24h old) is returned automatically. This gives every module basic offline data without per-module Drift tables.

**Error States:**

Tasks and checklists pages show error banners with a "Reintentar" (retry) button that re-triggers the load function, in addition to pull-to-refresh.

## Shared Widgets

Located at: `lib/shared/widgets/`

### BarcodeScannerSheet
Reusable barcode scanner bottom sheet.

```dart
final result = await BarcodeScannerSheet.show(
  context,
  title: 'Scan Code',
  subtitle: 'Point camera at barcode',
);
```

### SignatureCaptureWidget
Digital signature capture using the `signature` package. Exports PNG bytes on pen-up.

```dart
SignatureCaptureWidget(
  height: 250,
  onSignatureCaptured: (Uint8List bytes) {
    // PNG bytes of the signature
  },
  onClear: () {
    // Signature cleared
  },
)
```

Also available as a dialog:
```dart
final bytes = await SignatureCaptureDialog.show(context);
```

### MediaPickerWidget
Photo/video capture and selection.

```dart
MediaPickerWidget(
  maxPhotos: 5,
  onPhotosChanged: (photos) {
    // Handle selected photos
  },
)
```

### Authentication Updates

- Login page includes a "Forgot password?" link that opens the web forgot-password URL in the device browser
- JWT includes `organizationId` and `isPlatformAdmin` — stored in auth state

## Media Upload Service

Located at: `lib/core/services/media_upload_service.dart`

Handles uploading photos, signatures, and videos to the API's storage backend (S3 in production, MinIO in development).

```dart
final mediaService = ref.read(mediaUploadServiceProvider);

// Upload multiple photos — returns list of URLs
final photoUrls = await mediaService.uploadPhotos(photoFiles);

// Upload a signature — returns UploadResult with url
final result = await mediaService.uploadSignature(signatureBytes);
if (result.success) {
  print(result.url); // http://<host>:9000/signatures/<uuid>.png
}
```

The service reads its base URL from `AppConfig.apiBaseUrl` and sends files to `POST /uploads/photo`, `POST /uploads/signature`, or `POST /uploads/video`.

## API Integration

The app communicates with the NestJS backend via REST API.

### Configuration

API base URL is configured in `lib/core/config/app_config.dart`:

```dart
class AppConfig {
  static const String _devHost = 'http://<your-lan-ip>:3001';
  static const String _prodHost = 'https://api.plexoapp.com';

  // Set at build time: --dart-define=ENV=production
  static const String _env = String.fromEnvironment('ENV', defaultValue: 'development');
  static bool get isProduction => _env == 'production';

  static String get apiBaseUrl => '${isProduction ? _prodHost : _devHost}/api/v1';
}
```

For physical device testing, set `_devHost` to your Mac's LAN IP (get it with `ipconfig getifaddr en0`). The phone and Mac must be on the same WiFi network.

### Android Release Signing

1. Generate a keystore (one-time):
   ```bash
   keytool -genkey -v -keystore apps/mobile/android/upload-keystore.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. Copy `android/key.properties.example` to `android/key.properties` and fill in your passwords.
3. The `build.gradle.kts` automatically picks up `key.properties` for release builds. If the file doesn't exist, it falls back to debug signing.

### API Client

Located at: `lib/core/services/api_client.dart`

Uses **Dio** for HTTP requests with:
- Automatic token injection
- Token refresh on 401
- Request/response logging
- Error handling
- **Response cache** — successful GET responses are cached in SharedPreferences; on network failure, cached data (< 24h old) is returned as a fallback, giving every module basic offline "last known good" data

## Push Notifications

Uses **Firebase Cloud Messaging** for push notifications.

`Firebase.initializeApp()` is called in `main.dart` with a try/catch — the app works without Firebase config files (push notifications become no-ops, real-time updates still work via WebSocket).

### Setup

1. Create Firebase project
2. Add iOS/Android apps in Firebase Console
3. Download config files:
   - iOS: `GoogleService-Info.plist` → `ios/Runner/`
   - Android: `google-services.json` → `android/app/`

### Token Registration

On init and token refresh, the FCM token is sent to the backend via `POST /notifications/register-device`. Located in `lib/core/services/notification_service.dart`.

### Handling

Notifications are handled in `lib/core/services/notification_service.dart`:

```dart
// Foreground messages — shown as local notification
FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

// Background/terminated tap — navigates to relevant screen
FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
```

## Theming

App theme is defined in `lib/core/theme/`:

- `app_colors.dart` — Semantic color constants (success, error, warning, priority, category)
- `app_theme.dart` — Light and dark `ThemeData`, plus `IsDarkMode` extension

The app supports **light and dark mode** via Material 3's `ColorScheme` system.

### Color Usage Rules

**Use `Theme.of(context).colorScheme` for all theme-dependent colors:**

```dart
final colorScheme = Theme.of(context).colorScheme;

// Backgrounds
colorScheme.surface              // card/page background
colorScheme.surfaceContainerLow  // secondary surfaces
colorScheme.surfaceContainerHighest // elevated surfaces

// Text
colorScheme.onSurface            // primary text
colorScheme.onSurfaceVariant     // secondary/tertiary text

// Borders
colorScheme.outlineVariant       // subtle borders

// Brand
colorScheme.primary              // primary accent
colorScheme.onPrimary            // text on primary
```

**Use `AppColors` only for semantic constants** (same in both themes):

```dart
AppColors.success   // green — completion, approval
AppColors.error     // red — errors, rejection
AppColors.warning   // amber — pending, caution
AppColors.info      // blue — informational

// Priority & category colors
AppColors.priorityHigh
AppColors.categoryIT
// etc.
```

**DEPRECATED — do NOT use these** (they only work in light mode):

```dart
// AppColors.background, surface, surfaceVariant
// AppColors.textPrimary, textSecondary, textTertiary
// AppColors.border
```

### Dark Mode Helpers

```dart
// Quick brightness check (extension from app_theme.dart)
if (context.isDark) { ... }

// Adaptive opacity
color.withOpacity(context.isDark ? 0.2 : 0.1)

// Lighten colors in dark mode
color: isDark ? Color.lerp(catColor, Colors.white, 0.2)! : catColor
```

### Dark Surface Palette

The dark theme uses iOS-inspired grays:

| Token | Hex | Usage |
|-------|-----|-------|
| scaffoldBackground | `0xFF141416` | Page background |
| surface | `0xFF1C1C1E` | Cards, AppBar, Drawer |
| surfaceContainerLow | `0xFF2C2C2E` | Secondary surfaces |
| surfaceContainerHigh | `0xFF3A3A3C` | Elevated surfaces |
| outlineVariant | `0xFF48484A` | Subtle borders |

## Localization

The app is primarily in Spanish (es-DO) for Dominican Republic users.

All user-facing strings are in Spanish:
- "Recepciones" (Receivings)
- "Pendiente" (Pending)
- "En Proceso" (In Progress)
- "Completada" (Completed)
- "Con Incidencias" (With Issues)

## Testing

```bash
# Run unit tests
flutter test

# Run with coverage
flutter test --coverage

# Analyze code
flutter analyze
```

## Troubleshooting

### iOS Physical Device Deployment

`flutter run` may fail with "enable Developer Mode" on iOS 16+. Use this workaround:

```bash
# Build profile mode
flutter build ios --profile

# Install on device
xcrun devicectl device install app --device <DEVICE_ID> \
  build/ios/iphoneos/Runner.app

# Launch
xcrun devicectl device process launch --device <DEVICE_ID> \
  com.plexo.ops
```

Debug builds crash outside Xcode — use `--profile` or `--release` for standalone launch.

### Build Errors

```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### iOS Pod Issues

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android Build Issues

```bash
cd android
./gradlew clean
cd ..
flutter build apk
```

### Camera/Scanner Not Working

Permissions are already configured in the project:

**iOS** (`ios/Runner/Info.plist`) includes:
- `NSCameraUsageDescription` — barcode scanning and photo capture
- `NSPhotoLibraryUsageDescription` — photo selection

**Android** (`android/app/src/main/AndroidManifest.xml`) includes:
- `INTERNET`, `CAMERA`, `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE` (SDK <=32), `ACCESS_NETWORK_STATE`, `VIBRATE`

If camera still doesn't work, ensure the device has granted permission in system settings.

## Platform Requirements

| Platform | Min Version | Notes |
|----------|-------------|-------|
| iOS | 15.5 | Set in Podfile and Xcode project |
| Android | SDK 21 (5.0) | Flutter default via `flutter.minSdkVersion` |

**iOS App Transport Security:** `NSAllowsLocalNetworking` is enabled for local dev. Production HTTPS traffic works normally. No blanket `NSAllowsArbitraryLoads` — App Store safe.

---

Plexo Operations Mobile v2.0 — Multi-tenant SaaS
