# Bristol Free & Affordable: Phase 1

A mobile-first directory of free and affordable family places across Bristol and nearby towns.

**What's in Phase 1**
- Homepage, directory with search, filters and a map, a "for businesses" sign-up page
- "Claim this listing" on every unclaimed listing
- Admin page: add, edit and remove listings, upload photos, place map pins, see requests

No build step: it's plain HTML, CSS and JavaScript. Until Supabase is connected the site runs in **demo mode** with sample listings, so you can deploy it straight away.

## 1. Put it online (Netlify)
1. Sign in to Netlify with GitHub.
2. **Add new site → Import an existing project → GitHub → `bristol-free`**.
3. Leave the build settings empty (publish directory is `.`) and click **Deploy**.

Every change pushed to GitHub goes live automatically.

## 2. Connect the database (Supabase)
1. Create a free project at supabase.com. Choose the **London** region.
2. **SQL Editor → New query**: paste all of `supabase/schema.sql` and click **Run**.
3. Optional: do the same with `supabase/seed.sql` to load the sample listings.
4. **Project Settings → API**: copy the **Project URL** and the **anon public** key into `js/config.js`, then commit.

## 3. Make yourself an admin
1. Supabase → **Authentication → Users → Add user**. Enter your email and a password and tick "Auto confirm".
2. **SQL Editor**, run (with your email):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
3. Go to `/admin.html` on your site and sign in.

Repeat for anyone else who should manage listings.

## 4. Turn off public sign-ups
Supabase → **Authentication → Sign In / Providers → Email**: turn off **Allow new users to sign up**. Admins are added by you only.

## Files
| Path | What it is |
| --- | --- |
| `index.html`, `directory.html`, `business.html`, `admin.html` | The pages |
| `css/styles.css` | All styling |
| `js/config.js` | Your Supabase details |
| `js/data.js` | Loading listings, sending requests, categories and areas |
| `js/ui.js`, `js/claim.js` | Cards, the listing pop-up and claim form |
| `js/home.js`, `js/directory.js`, `js/business.js`, `js/admin.js` | Page logic |
| `js/demo-data.js` | Sample listings for demo mode |
| `supabase/schema.sql`, `supabase/seed.sql` | Database setup and sample data |

## Credits
Map tiles © OpenStreetMap contributors and CARTO. Postcode lookup by postcodes.io.
