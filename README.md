# Gaplash

A speaking practice platform for English learners, mainly IELTS candidates. Two friends join a private room and the app guides the conversation.

"Gaplash" is a placeholder name. Rename it in `src/config/app.ts`.

## Getting started

Requires Node 20.9 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

With no Supabase keys the app runs in **mock mode**: a pretend sign-in and sample sessions, so every screen can be reviewed with no backend. The Profile page has a panel for switching between the sample data states. Creating sessions and the live room need a real backend, so they are off in mock mode. The design system reference is at `/dev/design` and is only available in development.

## Connecting Supabase

Setting `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` turns mock mode off. In the Supabase project:

1. **Create the tables.** Link the project and run `npx supabase db push`, or paste the files from `supabase/migrations/` into the SQL editor, oldest first. There are two: profiles, then sessions and the room.
2. **Choose how people sign in.** `SIGN_IN_METHODS` in `src/config/app.ts` switches each method on or off. While the app is in testing it uses **email and password** only. For that, turn off **Confirm email** under Authentication → Sign In / Providers → Email, so a new account can sign in straight away without an email.
3. **Allow the sign-in redirect.** Needed for magic links and Google. Under Authentication → URL Configuration, set the Site URL. Under Redirect URLs, add `http://localhost:3000/**` for local development and `https://<your-domain>/auth/callback**` for production.
4. **Turn on Google** when you want it. Under Authentication → Providers → Google, add a client ID and secret from Google Cloud. In Google Cloud, the authorized redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`. Then set `google: true` in `SIGN_IN_METHODS`.
5. **Set up email for real users.** Supabase's built-in email is capped at 2 emails per hour for the whole project, and its templates can't be edited. Add your own SMTP provider under Authentication → Emails → SMTP Settings before launch, and turn **Confirm email** back on.
6. **Make email links work in any browser.** The default email link only works in the browser that asked for it, which fails for many people because mail and Telegram apps open links in their own browser. Once SMTP is set up, go to Authentication → Emails, and in both **Confirm sign up** and **Magic link or OTP**, use this link:

   ```html
   <a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Kirish</a>
   ```

7. **Use asymmetric JWT signing keys,** the default on new projects. Sessions are then verified locally. With the older shared secret, each check becomes a network call to Supabase.

Free Supabase projects pause after a week without use. Resume yours from the dashboard if the app suddenly cannot sign anyone in.

## Connecting LiveKit (audio and video)

1. Create a project at [LiveKit Cloud](https://cloud.livekit.io) and open **Settings → Keys**.
2. Put the project's WebSocket URL in `NEXT_PUBLIC_LIVEKIT_URL`, and the key and secret in `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`. The secret is only read on the server; never commit it or prefix it with `NEXT_PUBLIC_`.
3. Restart the dev server.

Without these, the room still works for questions, timers and roles, and says that video is not set up.

## Deploying to Vercel

The live site is a Vercel project connected to this GitHub repository: every push to `main` deploys to production. If a push does not show up, open the project's **Deployments → … → Create Deployment** and enter `main`.

Set these under **Settings → Environment Variables** (Production and Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_LIVEKIT_URL`, `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`. `NEXT_PUBLIC_APP_URL` is optional there: the site uses Vercel's production domain by default.

Browsers only allow the camera and microphone on `https://` pages or `localhost`, so testing on two devices needs the deployed site, not a local address.

## How the room works

- **Access.** A session has a private invite link. The first person to open it joins as the partner; after that the session is full. Only the two people can read the room, change it or get a video pass. The database enforces this with row-level security and checked functions, not the page.
- **Shared state.** What both people see (part, roles, question, timers) is stored in the session row with a version number. Each change is saved with the version it was based on. If the partner changed something first, the save is refused and both take the newer state, so nobody can skip a part with a double tap. After a save, the page tells the partner over LiveKit's data channel, and both pages also check the server every few seconds in case a message is lost.
- **Timers** use the server's clock, so both people see the same countdown even if a device clock is wrong. Part 2 preparation ends by itself after one minute.
- **Reconnecting.** A calm "Reconnecting…" shows while the video or the server can't be reached, and the room catches up when it can. Leaving with "come back later" keeps the session open; coming back goes through the waiting room again.
- **Keyboard:** Space for the next question, M for the microphone, C for the camera.

IELTS questions and free-talk topics live in `src/content/`. Add to them freely; ids must stay unique and stable, because sessions store them.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler |
| `npm test` | Run the unit tests |
| `npm run check:contrast` | Check the color tokens against WCAG AA |

## Where things live

| Path | Contents |
| --- | --- |
| `src/app/globals.css` | Design tokens: color, type, radius, elevation, motion |
| `src/i18n/index.ts` | All UI strings (Uzbek for now) |
| `src/config/` | App name, sign-in methods, environment and navigation |
| `src/proxy.ts` | Signed-out gate and session refresh |
| `src/services/` | Auth, profile, sessions and room data; `services/feedback` is reserved for later |
| `src/content/` | IELTS questions, cue cards and free-talk topics |
| `src/lib/room/` | The room's rules: state, actions and validation, with tests |
| `src/lib/livekit/` | Video passes, made on the server |
| `src/app/api/` | Room state and video pass endpoints |
| `src/lib/supabase/` | Supabase clients and database types |
| `supabase/migrations/` | Database schema, row-level security and room functions |
| `src/components/ui/` | Base components, restyled from shadcn/ui |
| `src/components/brand/` | Mascot and wordmark |
| `src/components/layout/` | Responsive app shell and navigation |
| `src/components/sessions/` | Session cards, lists, times and the invite link |
| `src/components/room/` | Waiting room, video stage, IELTS and free-talk panels, timer ring |
