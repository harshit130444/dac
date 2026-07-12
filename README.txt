DAC — DGU AI CELL · FINAL SITE
==============================

WHAT'S IN HERE
──────────────
  index.html                 the main site
  join-dac.html              application form  (OTP + Google Sheet)
  campus-ambassador.html     ambassador form   (Google Sheet)
  become-a-partner.html      partner form      (Google Sheet)
  book-meeting.html          Calendly booking
  terms.html                 Terms & Conditions
  partner-terms.html         Partner Terms & Conditions
  assets/                    partner logos + the award banner


HOW TO UPLOAD
─────────────
Drop all of the above into the ROOT of your GitHub repo — the same place your
existing index.html lives. Overwrite when asked. Then hard-refresh: Ctrl+Shift+R


⚠️ ONE THING YOU MUST KEEP
──────────────────────────
This zip does NOT contain the assets/team/ folder — you said the photos are
already in your repo, so I left them alone rather than overwrite them.

KEEP your existing assets/team/ folder exactly as it is. It must contain:

    tushar.jpeg      (or tushar-srivastava.png)
    puneet.png       (or puneet-kumar.png)
    merry.jpeg       (or merry.png)
    aman.jpeg
    mohit-aggarwal.png
    sanjay-jasola.png
    rajeev-bhardwaj.png

The page tries each of those names in turn, so either naming works. If a photo
is missing entirely, that person's tile shows their initials instead of a broken
image — so nothing looks broken, but do tell me and I'll fix the path.

Also: favicon.svg is gone. It's not needed — the icon is embedded inside every
page now. Delete favicon.svg from your repo if it's still there.


THE FORMS — ALL THREE FEED ONE SPREADSHEET
──────────────────────────────────────────
Endpoint (same for all three):
  https://script.google.com/macros/s/AKfycbwPpqKv_R5hyM_vpcILTrARcLee4RUxjBwL_mM78sJXjJnyHr0ZkXdWt4elsKNICNPi/exec

Each form sends a "Form" field, and your Apps Script files it into its own tab:

  join-dac.html            → tab "Join DAC"
  campus-ambassador.html   → tab "Campus Ambassador"
  become-a-partner.html    → tab "Partners"

Each tab writes its own column headers on the first submission. You create
nothing by hand. You do not need to touch Apps Script again.

The Join DAC OTP runs on EmailJS — nothing to do with Google, and untouched.

If a form is ever disconnected, it now REFUSES to submit and says so in red.
It will never again show a fake "thank you" while binning someone's application
(which is exactly what the old partner and ambassador pages were doing).


AFTER YOU UPLOAD — TEST THESE
─────────────────────────────
  1. Submit each of the three forms once. Three tabs should appear.
  2. Open book-meeting.html — the Calendly calendar should render inline.
  3. Check the Team section — all 7 photos should show.
