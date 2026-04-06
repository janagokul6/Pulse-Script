## Medijournal data model (v1)

High-level schema notes for the current app. This is descriptive of what exists today, and can evolve as we extend features.

---

### Core entities

- **User (`users`)**
  - `id` (string, PK)
  - `clerkUserId` (string, unique) — link to Clerk user
  - `email` (string, nullable) — optional, Clerk is source of truth
  - `name` (string, required)
  - `specialization` (string, nullable) — e.g. Cardiology
  - `experienceYears` (int, nullable)
  - `bio` (text, nullable)
  - `role` (enum `Role`: `doctor` \| `junior` \| `student` \| `admin`, default `doctor`)
  - `avatarUrl` (string, nullable)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)

- **Post (`posts`)**
  - `id` (string, PK)
  - `authorId` (string, FK → `users.id`)
  - `caseSummary` (text, required) — main narrative / presentation
  - `clinicalDecisions` (text, required) — decisions & reasoning
  - `outcome` (text, required)
  - `keyLessons` (text, required)
  - `specialty` (string, nullable) — normalized specialty label
  - `tags` (text[], default `[]`) — free-form tags for search/filter
  - `isPublished` (boolean, default `true`) — soft “draft/unpublished”
  - `isRemoved` (boolean, default `false`) — moderation flag; removed from feed
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)

- **Comment (`comments`)**
  - `id` (string, PK)
  - `postId` (string, FK → `posts.id`)
  - `userId` (string, FK → `users.id`)
  - `parentId` (string, FK → `comments.id`, nullable) — for threaded replies
  - `body` (text)
  - `createdAt` (timestamp)

- **Bookmark (`bookmarks`)**
  - Composite PK: (`userId`, `postId`)
  - `userId` (string, FK → `users.id`)
  - `postId` (string, FK → `posts.id`)
  - `createdAt` (timestamp)

- **Follow (`follows`)**
  - Composite PK: (`followerId`, `followingId`)
  - `followerId` (string, FK → `users.id`)
  - `followingId` (string, FK → `users.id`)
  - `createdAt` (timestamp)

---

### Notifications & devices

- **Notification (`notifications`)**
  - `id` (string, PK)
  - `userId` (string, FK → `users.id`) — recipient
  - `type` (string) — e.g. `new_post`, `comment`, `reply`
  - `referenceId` (string, nullable) — usually a `posts.id`
  - `title` (string, nullable)
  - `body` (text, nullable)
  - `readAt` (timestamp, nullable)
  - `createdAt` (timestamp)

- **Push subscription (`push_subscriptions`)**
  - `id` (string, PK)
  - `userId` (string, FK → `users.id`)
  - `token` (string, unique) — Expo push token
  - `createdAt` (timestamp)

---

### Current feature → data mapping

- **Auth / profiles**
  - Auth managed by Clerk; `users.clerkUserId` links back.
  - `/users/me` and `/users/:id` expose profile fields from `users`.
  - Profile screens currently show some hard-coded “stats” and a mock “Published Case Studies” list; in the future those should derive from real post analytics and `/posts` queries.

- **Feed & search**
  - `/feed` and `/posts` read from `posts` + `users`, filtered by:
    - `isPublished = true`, `isRemoved = false`
    - optional `specialty`
    - optional “following” filter using `follows`.
  - `/search` searches across `posts.caseSummary`, `clinicalDecisions`, `outcome`, `keyLessons`, `specialty`, returning posts plus author info.

- **Post lifecycle**
  - Create: `/posts` inserts into `posts` and notifies followers via `notifications` + `push_subscriptions`.
  - Read: `/posts/:id`, `/feed`, `/search`, `/bookmarks`, `/admin/posts`.
  - Update: `/posts/:id` (author only).
  - Delete/unpublish: `/posts/:id` sets `isPublished = false`.
  - Moderation: `/admin/posts` and `/admin/posts/:id` toggle `isRemoved` for visibility control.

- **Engagement**
  - Comments & replies stored in `comments` with optional `parentId`, hydrated with user info.
  - Bookmarks stored in `bookmarks`, surfaced in `/posts/:id` (`bookmarked` flag) and `/bookmarks`.
  - Follows stored in `follows`, used for:
    - `/users/me/following`
    - personalized `/feed?sort=following`
    - notification fan-out on new posts.

- **Notifications**
  - In-app list from `notifications` with optional unread filter.
  - Mark-all-read and single-read update `readAt`.
  - Mobile registers Expo push tokens into `push_subscriptions` via `/notifications/register-device`.

---

### Obvious next extensions (for later discussion)

These are not implemented yet but are natural evolutions of the current schema:

- **Post metrics / analytics**
  - Either counters on `posts` (views, commentsCount, bookmarksCount) or a separate `post_metrics` table for derived stats.
- **Richer user profile**
  - Structured fields for institution, country, credentials, links, etc., instead of hard-coded copy in the profile UI.
- **Content taxonomy**
  - Normalized `specialties` and `tags` tables if we want controlled vocabularies and better filtering.
- **Messaging**
  - If we add direct messages, introduce `conversations` and `messages` tables keyed by `users.id`.

This document is meant as a living summary of how the backend data model supports the mobile/web features; we can update it as we add new flows.

