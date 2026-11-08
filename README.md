# DAY ONE

A local-first habit, consistency, and accountability app built with Expo, React Native, TypeScript, Zustand, AsyncStorage, Expo Notifications, and Supabase.

## Features

- Email/password authentication with signup, login, logout, and password recovery flows
- Supabase-backed habits, completion history, and user settings
- Local persistence with Zustand and AsyncStorage
- Today dashboard and habit management
- Weekly history, accountability statuses, and recovery actions
- XP, levels, streaks, achievements, and completion celebrations
- Appearance preferences and haptics settings
- Weekly local habit reminders
- Local-to-cloud sync after sign-in, with queued updates and foreground retry

## Setup

1. Install Node.js LTS.
2. Copy `.env.example` to `.env` and add your Supabase project URL and publishable key.
3. Run `supabase/final-migration.sql` once in Supabase SQL Editor.
4. Ensure Email/Password auth is enabled and the reset-password redirect URL is configured in Supabase Authentication settings.
5. Install and start:

```bash
npm ci
npm run typecheck
npx expo start
```

## Validation

```bash
npm run typecheck
npx expo install --check
npx expo-doctor
```

## Important notes

- Cloud syncing is local-to-cloud after the initial merge. It does not yet fetch remote edits from another device in real time.
- The initial merge is local-wins for matching active habit IDs; there is no multi-device conflict-resolution strategy yet.
- Deleted habits are soft-deleted using `deleted_at` so their completion history is retained. Run the SQL migration before using the updated sync service.
- Local notifications should be tested on physical devices. Remote push notifications are not part of this implementation.
- Configure custom SMTP in Supabase before public launch so account emails are reliable.
- Test the password-reset deep link in an installed development/production build before release.

See `RELEASE_CHECKLIST.md` for the release test plan.
