# Dividendii articles: one-time setup (about 30 minutes, total cost: ₦0)

How it fits together, in one picture:

- **Your website** stays on Vercel, exactly where it is now. People visit dividendii.com and Vercel shows the site.
- **Your articles** live in a MySQL database on your Qserver hosting. A small address, `api.dividendii.com`, is the back room that stores them. You never visit it except once, to set up.
- **You publish** at `dividendii.com/admin/articles`. Sign in, write, press Publish. Nothing else, ever.

You do the steps below once, in this order. Steps 1 to 5 are on Qserver, steps 6 to 7 are on Vercel and GitHub, step 8 is the domain, steps 9 and 10 are the finish.

---

## Step 1. Create the back-room address (cPanel)

1. Log in to cPanel. Open **Domains** (or **Subdomains** on older layouts).
2. Create a subdomain: **api** under **dividendii.com**.
3. Leave the document root as cPanel suggests (usually `api.dividendii.com`). Do **not** put it inside `public_html`.
4. Click **Create**. Because your DNS is on Qserver, the address is created automatically. Nothing else to do.

## Step 2. Switch on the free padlock (https) for it

1. In cPanel open **SSL/TLS Status**.
2. Tick `api.dividendii.com` and click **Run AutoSSL**. Wait a few minutes until it shows a green padlock.
3. **Do not** buy anything in the SSL section. AutoSSL is free and is all you need.

## Step 3. Make the database (cPanel)

1. Open **MySQL Databases**.
2. Create a database, for example `articles` (cPanel adds your prefix, so it becomes something like `dividend_articles`).
3. Under **MySQL Users** create a user, for example `admin` (becomes `dividend_admin`), with a long password. Save the password somewhere.
4. Under **Add User To Database**, pick that user and that database, click **Add**, tick **All Privileges**, click **Make Changes**.

## Step 4. Upload the back room (cPanel File Manager)

1. Open **File Manager** and go into the `api.dividendii.com` folder.
2. In File Manager's **Settings** (top right) tick **Show Hidden Files (dotfiles)**.
3. Click **Upload** and upload `dividendii-api-for-qserver.zip`.
4. Select it and click **Extract**. You should now see inside the folder: `.htaccess`, `api`, `uploads`. Delete the zip afterwards.

## Step 5. Run the one-time installer

1. In a browser open **https://api.dividendii.com/api/install.php** (it must say https).
2. Enter the database name, user and password from Step 3. Leave the host as `localhost`.
3. "Website address" should already say `https://dividendii.com`. If it does not, type it.
4. "Other addresses you may open the admin from": type `vendii-securities.vercel.app` (this lets you test before the domain move in step 8).
5. Choose your admin email and a strong password (10+ characters). This is the only login. There is no public sign-up.
6. Click **Set everything up**. Your 10 draft articles are added automatically.
7. Back in File Manager, open the `api` folder and **delete `install.php`**. It has already locked itself, but delete it anyway.

## Step 6. Put the new site files on GitHub

Your Vercel project updates itself whenever its GitHub repository changes.

1. Open your site's repository on github.com.
2. Click **Add file → Upload files**.
3. Unzip `dividendii-source.zip` on your computer and drag in **everything inside** the unzipped folder (including the `api` and `server` folders and the file `vercel.json`). Let it replace files with the same names.
4. Click **Commit changes**.

If your Vercel project is not connected to GitHub, tell me and I will give you the other route.

## Step 7. Check the deploy

1. In Vercel open your project. A new deployment starts by itself and takes about a minute.
2. When it says **Ready**, open `https://vendii-securities.vercel.app/learn`. The lending and borrowing parts are now hidden everywhere on the site.
3. Open `https://vendii-securities.vercel.app/admin/articles` and sign in. You should see your 10 drafts. If the sign-in works here, everything is wired correctly.

## Step 8. Point dividendii.com at Vercel

Skip this step if dividendii.com already shows the Vercel site as itself (address bar stays `dividendii.com`). If it jumps to `vendii-securities.vercel.app`, do this.

1. In Vercel: **Project → Settings → Domains → Add** `dividendii.com`, and also `www.dividendii.com` (choose "redirect to dividendii.com").
2. Vercel shows the exact records it wants. In cPanel open **Zone Editor → Manage** next to dividendii.com and:
   - Edit the **A record** for `dividendii.com` so it points to the address Vercel shows (normally `76.76.21.21`).
   - Edit the **CNAME** for `www` so it points to the value Vercel shows (normally `cname.vercel-dns.com`).
3. **Leave every MX and TXT record alone.** Those are your email.
4. If cPanel has a **Redirects** entry sending dividendii.com to the vercel.app address, delete it.
5. Wait up to an hour. Vercel shows a green tick when it is ready, and adds its own free https.

Your `public_html` folder is not used by the website once this is done. You do not need to change it.

## Step 9. Publish your first article

1. Go to **https://dividendii.com/admin/articles** and sign in.
2. Open a draft, read it, edit as you like, add a featured image (upload it right in the editor), click **Preview**, then **Publish**.
3. The article is live at `dividendii.com/learn/its-slug` straight away and appears in the Learning Centre list. **Unpublish** takes it down again (allow up to a minute for it to disappear everywhere).

## Step 10. Tell Google (free, once)

1. Open search.google.com/search-console, add `dividendii.com`, and verify (it offers a DNS option: add the TXT record it gives you in Zone Editor).
2. Open **Sitemaps**, type `sitemap.xml`, press **Submit**. New articles are added to that sitemap by themselves.

---

## If something goes wrong

| What you see | What to do |
|---|---|
| "The article system is not set up yet" | Step 5 was not completed. Run the installer again. |
| Installer says access denied | The database user was not added to the database (Step 3, part 4). |
| Installer says the page is not secure | Step 2 is not finished. Wait for the green padlock, reload using https. |
| Sign-in on dividendii.com says "Blocked" | Open the admin at the exact address in Step 5 part 3, or add the address you are using in the installer's "other addresses" box. Forgot the password: in File Manager create an empty file `ALLOW_ADMIN_RESET.txt` inside the `api` folder, reopen the installer. |
| Images do not show | Check that the `uploads` folder exists next to `api` in `api.dividendii.com` and the zip extracted fully. |
| Draft shows to the public | It cannot: drafts are refused by the server. If you ever see one, tell me straight away. |

## Cost

| Part | Cost |
|---|---|
| Qserver hosting, MySQL, database, storage for images | already paid, no extra |
| `api` subdomain | free |
| https padlock (AutoSSL) | free |
| Vercel Hobby plan, build and hosting | free (see the note below) |
| Google Search Console | free |

**One thing to know about Vercel's free plan:** Vercel's terms describe the Hobby plan as for personal, non-commercial use. While Dividendii is a free educational site that is fine. Once it takes money from customers, check Vercel's current terms; the paid plan would then be required, or the site can move to another free host. I have not changed any plan or subscription.
