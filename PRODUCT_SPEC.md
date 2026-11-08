# DAY ONE — Product Specification v1

## Product summary
DAY ONE is a personal consistency and accountability app that turns goals into scheduled commitments, tracks follow-through, and helps users recover when they miss a commitment.

## Product decisions
- Audience: personal-first, designed to become a public product.
- Platforms: iOS and Android.
- Appearance: adaptive light and dark themes.
- Accountability: strict but constructive; no shame-based mechanics.
- Architecture: local-first, with cloud accounts and sync later.

## Product principles
1. Make the next action obvious.
2. Make commitments specific and scheduled.
3. Make completion and avoidance visible.
4. Prefer recovery over all-or-nothing streak pressure.
5. Keep the daily interaction fast.

## Core entities
### Goal
A longer-term outcome such as learning Python, improving fitness, or becoming more consistent with language practice.

Fields: id, title, description, category, target date (optional), status, createdAt.

### Habit
A recurring action that supports a goal.

Fields: id, title, goalId (optional), schedule days, local reminder time, target duration, minimum effort duration, priority, active status, createdAt.

### Completion
A dated record of what happened with a habit.

Fields: id, habitId, date, status (completed / minimum-completed / skipped / missed / rescheduled), actual duration (optional), note (optional), completedAt.

### Daily review
A short end-of-day reflection.

Fields: date, self-rating, blocker, reflection, tomorrow's priority.

## Primary navigation
- Today: today's commitments, completion progress, overdue items and next actions.
- Habits: create and manage recurring habits.
- Stats: streaks, completion rates and weekly/monthly trends.
- Settings: appearance, notification preferences, accountability settings and account.

## MVP scope (P0)
- Onboarding and initial habit setup.
- Today dashboard.
- Create, edit, pause and delete habits.
- Daily/weekly/custom weekday schedules.
- Target duration and minimum-effort duration.
- Local notifications with permission handling.
- Mark complete, minimum-completed, skipped or rescheduled.
- Local persistence and offline use.
- Adaptive light/dark theme.

## Follow-on scope (P1)
- Streaks and consistency score.
- Daily review.
- Weekly report.
- Historical calendar/heatmap.
- Missed-habit recovery flow.
- Notification actions and reminder escalation preferences.

## Later scope (P2/P3)
- Supabase authentication and sync.
- AI accountability coach and pattern insights.
- Optional social accountability / accountability partners.
- Public launch, onboarding analytics, privacy and accessibility review.

## Strict accountability rules
- A habit should have a clear schedule and a defined minimum effort.
- The app should make due and overdue commitments visible.
- A user must explicitly complete, skip or reschedule; silent disappearance is not the default.
- A skip or miss affects reporting, but should not erase all prior progress.
- Repeated misses should trigger a practical review: reduce the target, change the time, or reconsider the habit.
- Notifications should be configurable and should never become harassment.

## Initial implementation status
Included in this starter:
- Expo + React Native + TypeScript project structure.
- Expo Router tab navigation.
- Adaptive theme.
- Today dashboard and completion toggle.
- Add-habit modal with target/minimum durations and reminder time.
- Zustand persistence using AsyncStorage.
- Starter Stats and Settings screens.

Not yet implemented:
- Actual notification scheduling.
- Edit/delete/pause habit actions.
- Custom weekday picker.
- Completion states beyond a simple toggle.
- Historical stats and streak calculations.
- Authentication/cloud sync.

## Success measures for MVP
- A user can set up their first recurring habit in under one minute.
- A user can see today's commitments immediately on app open.
- A user can record completion in one tap.
- Habit data survives app restarts and works offline.
- A user can configure and receive a local reminder after granting permission.
