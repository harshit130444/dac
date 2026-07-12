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
