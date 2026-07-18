# Marib Tax Mobile

Arabic-first Flutter taxpayer application for Android, structured for future iOS support.

Current source foundation includes the API-03 `activity_address_change` draft model and a local, disabled-submit screen. It contains no API endpoint, Supabase key, privileged credential, production persistence, or external delivery integration.

Local gates:

```sh
flutter pub get
flutter analyze
flutter test
flutter build apk --debug --no-pub
```
