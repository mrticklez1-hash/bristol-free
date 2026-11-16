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

## 4. Sign-ups and the family card
Families sign in to **My card** with an email link, so sign-ups need to be **on**. Being signed in gives them nothing except their own card: admin access only comes from the `admins` table.

1. Run `supabase/update-05-whats-on-deals-recipes-card.sql` in the SQL Editor.
2. Supabase → **Authentication → Sign In / Providers**: turn **Allow new users to sign up** ON. Leave **Enable email provider** ON. Turn **Confirm email** ON.
3. Supabase → **Authentication → URL Configuration**: set **Site URL** to your site address (e.g. `https://bristolfree.netlify.app`) and add `https://bristolfree.netlify.app/card.html` under **Redirect URLs**.
4. Supabase → **Authentication → Emails → SMTP Settings**: connect your own email sender (for example Resend or Brevo, both have free tiers). Supabase's built-in email only sends a handful of emails an hour, which is fine for testing but not for a launch post to the group.
5. Optional: in **Emails → Templates → Magic link**, change the wording to something like "Here's your Bristol Free family card".

Businesses check a card by scanning its QR code with their phone camera. It opens `/v` on your site and shows a green tick, an amber "expired" (usually a screenshot) or a red cross.

## Files
| Path | What it is |
| --- | --- |
| `index.html`, `directory.html`, `listing.html`, `whats-on.html`, `deals.html`, `recipes.html`, `recipe.html`, `card.html`, `verify.html`, `business.html`, `admin.html` | The pages |
| `css/styles.css` | All styling |
| `js/config.js` | Your Supabase details |
| `js/data.js` | Loading listings, sending requests, categories and areas |
| `js/ui.js`, `js/claim.js` | Cards, the listing pop-up and claim form |
| `js/home.js`, `js/directory.js`, `js/business.js`, `js/admin.js` | Page logic |
| `js/whats-on.js`, `js/deals.js`, `js/recipes.js`, `js/recipe.js`, `js/card.js`, `js/verify.js`, `js/suggest.js`, `js/admin-content.js` | What's on, deals, recipes, the family card and their admin |
| `js/vendor/qrcode.js` | QR code generator (MIT licence, Kazuhiko Arase) |
| `js/demo-data.js`, `js/demo-extra.js` | Sample data for demo mode |
| `supabase/schema.sql`, `supabase/seed.sql` | Database setup and sample data |

## Credits
Map tiles © OpenStreetMap contributors. Postcode lookup by postcodes.io.
