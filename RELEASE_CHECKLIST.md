# DAY ONE release checklist

## Before running

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the Supabase project's public client credentials.
3. Run `supabase/final-migration.sql` once in Supabase SQL Editor.
4. Install dependencies with `npm ci`.

## Local validation

```bash
npm run typecheck
npx expo install --check
npx expo-doctor
npx expo start -c
```

## Supabase configuration

- Enable Email/Password authentication.
- Add the app's reset-password redirect URI to Authentication → URL Configuration.
- Keep Row Level Security enabled on `habits`, `habit_completions`, and `user_settings`.
- Keep the existing owner-only policies based on `auth.uid() = user_id`.
- Enable Realtime for the tables only if realtime cross-device updates are implemented later; this version does not subscribe to remote database changes.

## Device testing

- Create an account and sign in.
- Create, edit, pause, complete, uncomplete, and delete a habit.
- Change appearance and haptics settings.
- Close and reopen the app; confirm local state persists.
- Sign out and sign back in; confirm cloud data loads.
- Test reminder permission and scheduled notifications on a physical device.
- Test password reset using the installed app/development build and the configured redirect URI.

## Current release limitations

- Cloud sync is local-to-cloud after the initial merge and retries when the app returns to the foreground. It does not yet pull remote edits made on another device in real time.
- Initial merge is local-wins for matching active habit IDs; this is not a conflict-resolution system.
- Expo Go on Android does not support remote push notifications; local scheduled notifications are used here.
- Supabase email delivery limits depend on the project's email provider/configuration. Configure custom SMTP before public launch.
- Run an EAS development/production build and test on real iOS/Android devices before store submission.
