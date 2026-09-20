# ROCOCO — activation du tableau de bord

The admin interface is available at `admin.html`. Complete these steps once:

1. Create a free project at https://supabase.com/dashboard.
2. Open **SQL Editor**, paste everything from `supabase-setup.sql`, and select **Run**.
3. Open **Authentication → Users → Add user**.
4. Create the user `onglesrococo@gmail.com` with a new private password. Do not reuse a password that has been shared in a message or stored in website code.
5. Open **Project Settings → Data API** and copy the **Project URL** and **Publishable key** (sometimes labelled `anon` key).
6. Open `supabase-config.js` and replace the two `PASTE_...` values. Never use the `service_role` key.
7. Upload the updated files to GitHub and visit `https://dhruvkumarparmar.github.io/rococo/admin.html`.

The SQL enables Row Level Security. Visitors can read visible website content, but only the authenticated ROCOCO email can add, edit, hide, or delete records and images.
