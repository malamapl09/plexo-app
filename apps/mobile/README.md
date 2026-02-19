# Plexo Operations - Mobile App

Flutter app for store operations management. See [docs/MOBILE.md](../../docs/MOBILE.md) for full documentation.

## Quick Start

```bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run
```

## App Identifier

- iOS & Android: `com.plexo.ops`

## Build

```bash
# Development
flutter run

# Production
flutter build apk --release --dart-define=ENV=production
flutter build ios --release --dart-define=ENV=production
```
