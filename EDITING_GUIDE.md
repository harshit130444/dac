# DAC website — editing guide

Read the first section before changing anything. It explains why some of this
site is easy to edit and some of it isn't, which will save you an hour of
confusion.

---

## 1. What you're looking at

Seven standalone HTML pages. No build step, no `npm install`, no framework to
learn. Edit a file, commit, push — GitHub Pages redeploys in about two minutes.

| File | What it is |
|---|---|
| `index.html` | The landing page. **See the warning below.** |
| `join-dac.html` | Membership application (with email OTP) |
| `campus-ambassador.html` | Campus Ambassador programme |
| `become-a-partner.html` | Industry partnership |
| `book-meeting.html` | Calendly booking |
| `terms.html` | Terms & conduct |
| `partner-terms.html` | Partner terms |

Each page is self-contained: its CSS, JavaScript, images and fonts are all
inside the one file. That's why they're 500 KB each — most of it is
base64-encoded images. **Don't be alarmed by the file size, and don't try to
read it top to bottom.** Use Ctrl+F and the search strings in section 4.

### ⚠️ The one thing you must know about `index.html`

The six other pages are hand-written HTML — readable, editable, normal.

`index.html` is **not**. Its `<head>` contains a 1.8 MB compiled React bundle
(one single line of minified JavaScript). That file was *generated* by a build
tool from a React/Vite source project. It has no source maps and no comments.

**You cannot meaningfully hand-edit that bundle.** Small surgical string
replacements work — that's how the changes in section 4 are done — but anything
structural means finding the original React project, editing it there, and
running its build.

If the React source project still exists, **that** is where index.html's
content should be changed. Every hand-edit to the bundle gets wiped the next
time someone runs the build.

---

## 2. The SITE CONFIG block — start here

Every page has this near the top, right after `<body>`:

```js
window.DAC_CONFIG = {
  members      : 250,
  partners     : 7,
  events       : 8,
  email        : "dac@dgu.ac.in",
  dashboardUrl : "https://dgu-dac.base44.app/",
  sheetUrl     : "https://script.google.com/macros/s/.../exec",
  subscribeTab : "Subscribers"
};
```

Change `members: 250` to `members: 300` and it updates **everywhere on that
page at once** — the big animated counter, the robot's speech bubble, the
chatbot's answer, the stat strip. No hunting through minified code.

**It's per-page, so make the same edit in all seven files.** A find-and-replace
across the folder is the fastest way.

---

## 3. Where the Google Sheet lives

Every form on the site — Join DAC, Campus Ambassador, Partner, Subscribe, and
the chatbot's unanswered-question log — posts to **one** Apps Script endpoint,
which files each submission into its own tab based on a `"Form"` field:

| Form | Tab it creates |
|---|---|
| Join DAC | `Join DAC` |
| Campus Ambassador | `Campus Ambassador` |
| Become a Partner | `Become a Partner` |
| Subscribe button | `Subscribers` |
| Chatbot misses | `Bot Questions` |

Columns build themselves from whatever keys you send. **You never need to touch
the Apps Script.** To send subscribers somewhere else, change `subscribeTab` in
SITE CONFIG.

---

## 4. Common edits — search strings

Open the file, Ctrl+F for the string in the middle column.

### Content

| I want to change... | Search for | In |
|---|---|---|
| Member / partner / event counts | `window.DAC_CONFIG` | all 7 |
| Contact email shown on the page | `dac@dgu.ac.in` | all 7 |
| Dashboard link target | `dashboardUrl` | all 7 |

### Navigation

| I want to... | Search for | In |
|---|---|---|
| Add / rename / reorder a nav link | `uf=[{label:` | `index.html` |
| Same, on the other pages | `<div class="nav-links">` | other 6 |
| Edit the burger menu | `<div class="menu-list">` | other 6 |
| Change where the burger appears | `@media(min-width:1180px)` | other 6 |

Nav links on `index.html` live in a single array — this is one of the few
places the bundle is genuinely easy to edit:

```js
uf=[{label:`About`,href:`#about`}, ... ,{label:`Book a Meeting`,href:`./book-meeting.html`,external:!0}]
```

Add `external:!0` to any link that should open in a new tab.

### Footer

| I want to... | Search for | In |
|---|---|---|
| Edit the Explore column | `DC=[{label:` | `index.html` |
| Edit the Get Involved column | `OC=[{label:` | `index.html` |
| Edit the social links | `EC=[{label:` | `index.html` |
| Edit any footer column | `<div class="fg">` | other 6 |

### The subscribe button

| I want to... | Search for |
|---|---|
| Change the popup wording | `Subscribe now` |
| Change where subscribers land | `subscribeTab` in SITE CONFIG |
| Move / restyle the floating tab | `.dacx-tab{` |

All of the subscribe code sits in one block near the bottom of each page,
marked `DAC ADD-ONS`. Everything in it is prefixed `dacx-` so it can't collide
with the rest of the page.

### The chatbot

The chatbot is **not** an LLM. It matches questions against a fixed list of
answers, and users can only pick from a menu — there's no text box, so a typo
can never produce a miss.

| I want to... | Search for |
|---|---|
| Edit an existing answer | `const KB = [` then find the topic |
| Change which questions appear in the menu | `const MENU = [` |
| Change the greeting | `Hey! 👋 I'm <b>DAC</b>` |

**To add a new question**, two steps in that order:

1. Add an entry to `KB`:
   ```js
   { id:'newtopic',
     keys:['words','that','should','match'],
     a:"The answer. <b>HTML</b> is allowed.",
     chips:['A follow-up question','Another one'] },
   ```
2. Point a `MENU` row at its id:
   ```js
   ['newtopic', 'The question as shown in the menu'],
   ```

The id in `MENU` **must** exist in `KB` or that button falls back to the
"I don't know that" reply. Do this in all seven files.

### Header sizing

| I want to... | Search for |
|---|---|
| Make the nav bar wider or narrower | `.dacx-nav{max-width:` and `.nav-in{max-width:` |
| Change nav link text size | `.dacx-navlink{font-size:` |
| Change the wordmark | `.dacx-mark{` and `.dacx-sub{` |

The nav carries eleven links, so the link size steps down on narrower screens
to stop it wrapping — that's the three `@media` rules under `.dacx-navlink`.
If you add a twelfth link, check the bar at 1280 px wide before shipping.

### Downloads

The brochure and rulebook are in `assets/docs/`. To publish a new edition,
**overwrite the file keeping the same filename** — no HTML changes needed.

---

## 5. House rules

**Everything I added is prefixed.** `dacx-` for the subscribe/header/footer
additions, `dacb-` for the chatbot. If a class doesn't have one of those
prefixes, it came with the original design — be more careful changing it.

**Make the same edit in all seven files.** There's no shared header/footer
include; each page carries its own copy. This is the main cost of the
no-build-step approach. Find-and-replace across the folder is your friend.

**Test at 1280 px wide.** That's the tightest desktop width, just above where
the burger menu takes over. If something's going to break, it breaks there.

**Hard-refresh after deploying** — Ctrl+Shift+R. A normal refresh serves the
cached old page and you'll think your change didn't work.

---

## 6. Deploying

```cmd
cd C:\path\to\dac
git pull
git add -A
git commit -m "what you changed"
git push origin main
```

Wait 1–3 minutes, then hard-refresh aicelldgu.in.

`CNAME` is what points the repo at the domain. **Never delete it.** If
`git status` ever shows CNAME as deleted, stop and restore it.
