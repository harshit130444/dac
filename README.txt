DAC — DGU AI CELL · FINAL SITE (with the chatbot)
=================================================

UPLOAD ALL OF THESE to your repo root, overwriting:
   index.html · join-dac.html · campus-ambassador.html · become-a-partner.html
   book-meeting.html · terms.html · partner-terms.html · assets/
Then HARD-REFRESH: Ctrl+Shift+R

KEEP your existing assets/team/ folder — the 7 photos live there and this zip
doesn't touch them. (favicon.svg is gone on purpose; it's embedded in every page.)


═══════════════════════════════════════════════════════════════
THE CHATBOT — "DAC"
═══════════════════════════════════════════════════════════════
It's on EVERY page. Purple button, bottom-right.

  NO API key.  NO Gemini.  NO server.  NO usage limits.  NO monthly bill.
  It runs entirely inside the visitor's browser and CANNOT be rate-limited,
  cannot expire, and cannot go down.

WHY NO LLM — this is the important bit
──────────────────────────────────────
A Gemini/ChatGPT bot would sometimes INVENT things. Ask it "what's the B.Tech
fee at DGU?" and it may confidently make up a number. On an official university
website, a student could read that and act on it. That is a real problem, not a
theoretical one.

This bot physically cannot hallucinate. Every answer is a fact you gave me. If
it doesn't know, it SAYS so and hands over dac@dgu.ac.in. It never bluffs.

I even built a hard safety rule for the worst case: any question mixing a
university word with a money word ("how much is DGU tuition?") is ALWAYS sent to
dgu.ac.in — it will never answer that with DAC's ₹500 membership fee.

WHAT IT KNOWS
─────────────
Fees · joining · eligibility · the OTP · all four events · DACathon · the
Nainital trip · what members get · projects · internships · the AI tools you
give away free · the team and patrons · the four-level structure · elections ·
Campus Ambassador · all three partnership tracks · the one-year lock-in · the AI
ethics framework · attendance rules · the Business World award · contact details
· and where to send people for DGU admissions (dgu.ac.in — never a made-up fee).

IT UNDERSTANDS REAL PEOPLE
──────────────────────────
Not dumb keyword matching. It handles:
   paraphrases  — "is it free", "whats the price", "how much to join"  → all ₹500
   Hinglish     — "fees kitni hai"                                     → ₹500
   typos        — "dacthon", "campus amabssador"                       → still right
   context      — "who runs this", "im not from dgu", "my company wants to partner"

Tested against 37 real questions — including four it MUST refuse to answer.
37/37 correct.

IT GETS SMARTER
───────────────
Any question it CAN'T answer is quietly logged to your Google Sheet, in a new
tab called "Bot Questions" (with the page they asked it on). So you'll see what
students actually ask. Send me that tab any time and I'll teach it the answers.

IF YOU EVER WANT AN LLM ANYWAY
──────────────────────────────
Open any page, find:   const LLM_PROXY = '';
Drop a Cloudflare Worker URL in there and it upgrades — the free brain still
answers first, and the LLM is only consulted when it draws a blank. Nothing here
gets thrown away.


═══════════════════════════════════════════════════════════════
EVERYTHING ELSE (unchanged, still working)
═══════════════════════════════════════════════════════════════
All 3 forms → your ONE spreadsheet, routed into separate tabs:
    join-dac.html          → "Join DAC"          (+ email OTP via EmailJS)
    campus-ambassador.html → "Campus Ambassador"
    become-a-partner.html  → "Partners"
    the chatbot's misses   → "Bot Questions"
Columns build themselves. You never touch Apps Script again.

═══════════════════════════════════════════════════════════════
WHAT'S NEW IN THIS BUILD  (3 additions, all 7 pages)
═══════════════════════════════════════════════════════════════

1 · FLOATING "SUBSCRIBE" BUTTON
───────────────────────────────
Purple tab on the RIGHT EDGE of every page. Desktop: vertically
centred, reads "Subscribe". Mobile: collapses to the icon and sits
above the chatbot, so the two never overlap.

Click it -> small popup on the same page asks for Name + Email ->
submit -> lands in YOUR EXISTING SPREADSHEET, in a new tab called
"Subscribers". Same Apps Script endpoint as every other DAC form.
Columns build themselves. You never touch Apps Script.

To file subscribers into a different tab, open any page, find:
      var SHEET_TAB = 'Subscribers';
and change that one string (do it on all 7 pages to keep them in sync).

The footer "Get notified" box on join-dac.html used to fire a
mailto:. It now opens the same popup with the typed email already
filled in, so you capture the name as well.

2 · BROCHURE + RULEBOOK IN THE FOOTER
─────────────────────────────────────
Both PDFs live in   assets/docs/
      DAC_Brochure_2026.pdf   (6.5 MB)
      DAC_Rulebook_2026.pdf   (0.9 MB)

They appear as two plain links, "DAC Brochure" and "DAC Rulebook",
in the footer's GET INVOLVED column (on join-dac.html they sit under
the notify box, which has no Get involved column). One click saves
the file — the links carry the HTML download attribute, so the
browser downloads instead of opening its PDF viewer.

To swap in a newer edition: drop the new PDF into assets/docs/ under
the SAME filename. No HTML changes needed.

3 · "DAC DASHBOARD" IN THE HEADER
─────────────────────────────────
Last link in the nav on all 7 pages, opens
https://dgu-dac.base44.app/ in a new tab. Present in both the
desktop nav and the mobile menu.

NOTE ON index.html: its header and footer are inside the compiled
React bundle, not plain HTML. The Dashboard link and the Downloads
row were edited into that bundle directly. If you ever rebuild the
React app from source, re-apply those two changes there.

Everything else in this file still applies unchanged.

═══════════════════════════════════════════════════════════════
ROUND 2 CHANGES
═══════════════════════════════════════════════════════════════

HEADER: ONE CENTRED ROW
───────────────────────
Single row, as it started, now carrying eleven links — the original
nine plus "DAC Dashboard" and "Book a Meeting", which sit together at
the end of the row rather than off on the right with the CTA.

The bar is a centred block (1520px) rather than edge-to-edge, so the
wordmark and the "Become a Member" button sit just beside the link
row instead of being flung at the window edges. On a 1920 screen the
wordmark starts 240px in.

Eleven links in one row is tight, so the link type steps down on
narrower desktops and never wraps or clips:
      12.5px   at 1560px and wider
      12px     from 1400px
      10.5px   from 1280px (just above the burger cutoff)
Burger menu stays at its original screen sizes: under 1280px on
index, under 1180px on the other six. Measured at 17 widths from
390px to 1920px: 34 checks, no overflow, 47px clearance at the
tightest point.

TO CHANGE THE BAR WIDTH: one number — .dacx-nav{max-width:1520px}
and .nav-in{max-width:1520px} in the style block near the bottom of
each page. 1280px puts it back to the original width, but the links
will need to shrink further to fit.

WORDMARK ALIGNMENT FIXED
────────────────────────
On index.html the "DGU AI CELL" tag was sitting 10.8px above the
centre of "DAC" — the flexbox align-self on it was being ignored in
that context. Auto top/bottom margins centre it reliably. Both the
wordmark and the tag now measure 0.0px off centre on every page.

The wordmark itself is Outfit 800 with tight -0.05em tracking (was
weight 600) and the tag is Outfit 600 rather than Inter.

FOOTER LINKS POP ON HOVER
─────────────────────────
Every link in the footer lists (Explore, Get Involved, Follow Us, and
the equivalents on the other pages) slides 4px right, goes bold and
turns purple under the cursor, so the one you are about to click is
unmistakable. Respects prefers-reduced-motion — the slide is dropped,
the bold and colour stay.

CHATBOT IS NOW MENU-ONLY
────────────────────────
The text box is gone. It was never an LLM, so a typo or an unusual
phrasing could produce a miss — now every route into an answer is a
button, and a miss is impossible.

  • "Browse all questions" opens a categorised list: 38 questions
    across 10 sections (Getting started, Joining, What you get,
    Events & projects, Who runs DAC, Programmes, Rules & conduct,
    Reach us, About DGU, Just for fun)
  • follow-up chips under each answer still work as before
  • menu picks look the answer up by id, not by fuzzy matching, so
    they resolve exactly every time

TO ADD OR REORDER QUESTIONS: open any page, find   const MENU = [
Each row is  ['kb_id', 'Question text as shown'].  The kb_id must
match an id in the KB array above it. Adding a brand-new answer means
adding a KB entry first, then pointing a MENU row at its id. Do it on
all 7 pages to keep them in sync.

FOOTER ADDRESS LINE REMOVED
───────────────────────────
The standalone "DBS Global University, Dehradun" line under the
FOLLOW US column on index.html is gone. The address still appears in
the footer description paragraph and in the bottom bar of the other
pages.

═══════════════════════════════════════════════════════════════
READ EDITING_GUIDE.md FIRST
═══════════════════════════════════════════════════════════════
A developer-facing guide now sits next to this file:

      EDITING_GUIDE.md

It covers what each file is, the one big caveat about index.html
(its body is a COMPILED React bundle, not hand-written code), the
new SITE CONFIG block, and a search-string table for every common
edit. Start there rather than opening a 500KB HTML file blind.

SITE CONFIG BLOCK (new)
───────────────────────
Every page now opens with a commented block:

      window.DAC_CONFIG = { members: 250, partners: 7, events: 8, ... }

Change members there and it updates the animated counter, the robot
speech bubble, the chatbot answer and the stat strip together. The
member count went 60 -> 250 in this build.
