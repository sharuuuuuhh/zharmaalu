# Supabase Database Setup Guide

This guide walks you through setting up a free database on **Supabase** to sync your names, anniversary, and photos between your devices in real time.

---

## Step 1: Create a Supabase Project

1. Go to [Supabase.com](https://supabase.com) and click **Sign Up** (it's free and takes seconds with GitHub or email).
2. Click **New Project** on your dashboard.
3. Choose a name (e.g., `our-love-biopic`), enter a secure database password, choose the server region closest to you, and click **Create New Project**.
4. Wait about 1-2 minutes for your database to provision.

---

## Step 2: Create the Database Tables

We need two tables: `memories` for your photos/notes, and `settings` for syncing your names and anniversary.

1. In the left-hand navigation bar, click on the **SQL Editor** (the `>_` icon).
2. Click **New Query**.
3. Paste the following SQL script into the query window:

```sql
-- 1. Create the memories table
create table memories (
  id bigint primary key,
  title text not null,
  date date not null,
  image text not null,
  note text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable public access for memories table
alter table memories enable row level security;
create policy "Public read access" on memories for select using (true);
create policy "Public insert access" on memories for insert with check (true);
create policy "Public update access" on memories for update using (true);
create policy "Public delete access" on memories for delete using (true);


-- 2. Create the settings table
create table settings (
  key text primary key,
  value text not null
);

-- Enable public access for settings table
alter table settings enable row level security;
create policy "Public read access" on settings for select using (true);
create policy "Public insert access" on settings for insert with check (true);
create policy "Public update access" on settings for update using (true);
create policy "Public delete access" on settings for delete using (true);
```

4. Click **Run** (bottom right of the query window). You should see a message saying "Success. No rows returned".

---

## Step 3: Get Your API Credentials

1. In the left-hand navigation bar of Supabase, click **Project Settings** (the gear icon ⚙).
2. Click **API**.
3. Find the following two values:
   * **Project URL**: Under the *Project API URL* section (e.g., `https://xxxxxx.supabase.co`).
   * **Anon Public Key**: Under the *Project API Keys* section (starts with `eyJhbGciOi...`).

---

## Step 4: Connect Your Website

1. Open your biopic website in the browser.
2. In the top right corner, click the **Database Icon** (next to the theme toggle).
3. Paste your **Supabase URL** and **Anon API Key** into the input boxes.
4. Click **Save & Connect**.
5. **Success!** Your website status badge will change to **Cloud Connected 🟢**. All your current local memories will automatically upload to your database, and any changes will sync instantly to all other browsers and phones!
