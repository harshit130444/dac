(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════════════════
     DAC — the site's chatbot.

     NO LLM. NO API KEY. NO SERVER. NO USAGE LIMITS. CANNOT HALLUCINATE.

     Every answer below is a fact I was given. The bot either finds a match
     or admits it doesn't know and hands over dac@dgu.ac.in. It will never
     invent a fee, a date, or a placement statistic — which matters, because
     this is an official university site and a student might act on it.

     If you ever want to bolt an LLM on top, set LLM_PROXY to a Cloudflare
     Worker URL. Everything below still runs first; the LLM would only be
     asked when the knowledge base draws a blank.
     ════════════════════════════════════════════════════════════════════ */
  const LLM_PROXY = '';   // leave empty = free local brain only

  /* Log questions the bot COULDN'T answer into your Google Sheet, so you can
     see what students actually ask and I can teach it the answers.
     Creates a "Bot Questions" tab. Set to '' to switch off. */
  const LOG_URL = (window.DAC_CONFIG || {}).sheetUrl || 'https://script.google.com/macros/s/AKfycbwPpqKv_R5hyM_vpcILTrARcLee4RUxjBwL_mM78sJXjJnyHr0ZkXdWt4elsKNICNPi/exec';

  /* the three headline numbers, from the SITE CONFIG block at the top */
  const _C = window.DAC_CONFIG || {};
  const N_MEMBERS = _C.members || 250, N_PARTNERS = _C.partners || 7,
        N_EVENTS  = _C.events  || 8;

  /* ═══════════════════════ KNOWLEDGE BASE ═══════════════════════
     keys  = words/phrases that point at this answer (synonyms + Hinglish)
     a     = the answer (HTML)
     chips = follow-up buttons offered afterwards                        */
  const KB = [

  /* ── small talk ─────────────────────────────────────────────── */
  { id:'greet',
    keys:['hi','hii','hiii','hey','hello','helo','yo','namaste','hola','sup','good morning','good evening','good afternoon','hey there','anyone there'],
    a:"Hey! 👋 I'm <b>DAC</b> — the AI Cell's very chatty assistant.<br><br>I know pretty much everything about the Cell: fees, events, how to join, who runs it, what you actually get out of it. Fire away!",
    chips:['What is DAC?','How do I join?','What does it cost?','What events are coming up?'] },

  { id:'whoareyou',
    keys:['who are you','what are you','your name','who r u','introduce yourself','what is your name','who is dac bot','about you'],
    a:"I'm <b>DAC</b> — named after the Cell itself, because I <i>am</i> the Cell, in chat form. 😎<br><br>Here's the fun bit: I'm not powered by ChatGPT or Gemini. I run entirely inside your browser, know exactly what I know, and <b>never make things up</b>. Ask me something I don't know and I'll say so — I won't invent a fee or a date just to look clever.",
    chips:['Are you an AI?','What can you do?','What is DAC?'] },

  { id:'areyouai',
    keys:['are you ai','are you a bot','are you real','are you human','are you chatgpt','are you gemini','llm','artificial intelligence bot','robot ho kya'],
    a:"Bot, and proud of it. 🤖 But <b>not</b> an LLM — no ChatGPT, no Gemini, no API key burning anyone's money.<br><br>I'm a knowledge-driven assistant. That means I'm instant, I'm free forever, I can't go down, and — most importantly — <b>I can't hallucinate</b>. An LLM might confidently invent a fee for you. I'd rather tell you the truth or tell you nothing.",
    chips:['What can you do?','What does it cost?','Contact a human'] },

  { id:'help',
    keys:['what can you do','help','options','menu','commands','what can i ask','capabilities','guide me','topics'],
    a:"Loads! Try me on:<ul><li><b>Joining</b> — fees, eligibility, the form, the OTP</li><li><b>Events</b> — DACathon, the Startup Meetup, Nainital</li><li><b>What you get</b> — projects, internships, industry access</li><li><b>The team</b> — patrons, leadership, structure</li><li><b>Partnerships</b> — for companies & institutions</li><li><b>Campus Ambassador</b> — if you're at another college</li><li><b>AI tools</b> — the ones we give you free</li></ul>Go on, ask me something.",
    chips:['How do I join?','What events are coming up?','What do I get?','Who runs DAC?'] },

  { id:'thanks',
    keys:['thanks','thank you','thankyou','thx','ty','appreciate','shukriya','dhanyavaad','cheers','great','awesome','nice','cool','helpful'],
    a:"Anytime! 🙌 That's literally why I exist.<br><br>If I've convinced you even slightly — <a href='./join-dac.html'>the application form is right here</a>. Takes about three minutes.",
    chips:['How do I join?','What does it cost?','What events are coming up?'] },

  { id:'bye',
    keys:['bye','goodbye','see you','see ya','later','cya','tata','ok bye','thats all','thats it'],
    a:"Go build something! 🚀 I'll be right here in the corner if you think of anything else.<br><br>And hey — <a href='./join-dac.html'>applications are open</a>. Just saying. 😉",
    chips:['How do I join?','What events are coming up?'] },

  { id:'howareyou',
    keys:['how are you','how r u','how do you do','whats up','how you doing','kaise ho'],
    a:"Buzzing, honestly. ⚡ We've got a hackathon coming, a startup meetup, and a Nainital trip where the best AI-edited video gets its fee refunded. It's a good time to be the DAC bot.<br><br>More to the point — how can I help <i>you</i>?",
    chips:['What events are coming up?','What is DAC?','How do I join?'] },

  { id:'joke',
    keys:['joke','funny','make me laugh','tell me a joke','entertain me'],
    a:"Why did the neural network refuse to go to the party?<br><br>It was <b>overfitting</b> in. 🙃<br><br>...I'll show myself out. But seriously — come to DACathon on <b>5 September</b> and I promise the humans there are funnier than me.",
    chips:['Tell me about DACathon','What events are coming up?'] },

  { id:'whobuilt',
    keys:['who made you','who built you','who created you','who developed this','who made this website','who built this site','developer'],
    a:"I was built for the <b>DGU AI Cell</b> — by the Cell, for the Cell. Fitting, really: an AI club with an AI on its website. 🤝<br><br>Want to build things like this? That's exactly what DAC members do.",
    chips:['What do I get?','How do I join?','Tell me about projects'] },

  /* ── core: what is DAC ──────────────────────────────────────── */
  { id:'about',
    keys:['what is dac','about dac','who is dac','what is the ai cell','about ai cell','what do you do','about the club','what is this','tell me about dac','dac kya hai','dac full form','meaning of dac','purpose'],
    a:"<b>DAC</b> is the official <b>AI Cell of DBS Global University</b>, Dehradun — the university's principal body for AI <b>research, education, outreach and responsible innovation</b>.<br><br>Translation: it's where students actually <b>build</b> AI instead of just reading about it. Real projects, real industry partners, real deadlines.<br><br><span class='dacb-hi'>Learn · Build · Innovate</span> — that's the whole idea.",
    chips:['What do I get?','How do I join?','Tell me about projects','Who runs DAC?'] },

  { id:'stats',
    keys:['how many members','how big','size','members','how many people','community size','strength','how many students'],
    a:"Right now: <b>" + N_MEMBERS + "+ active members</b> across the globe, <b>" + N_PARTNERS + "+ industry networks</b>, and <b>" + N_EVENTS + "+ AI workshops and events</b> run so far. 📈<br><br>Growing fast — and yes, applications are open.",
    chips:['How do I join?','What events are coming up?','Who are your partners?'] },

  { id:'vision',
    keys:['vision','mission','objectives','goal','aim','purpose of dac','what do you stand for','values','core values'],
    a:"Our pillars: <span class='dacb-hi'>Innovate — Automate — Elevate</span>.<br><br><b>Vision:</b> to be a leading student-driven AI cell that empowers ideas with AI and technology, building a responsible, ethical, industry-connected AI ecosystem at DGU and beyond.<br><br><b>Core values:</b><ul><li>Excellence</li><li>Integrity</li><li>Responsible AI</li><li>Collaboration</li><li>Accountability</li><li>Innovation</li></ul>The full detail is in our <a href='./terms.html'>Terms &amp; Conditions</a>.",
    chips:['What is responsible AI?','What do I get?','How do I join?'] },

  /* ── fees ───────────────────────────────────────────────────── */
  { id:'fees',
    keys:['fee','fees','cost','costs','price','pricing','charges','charge','money','paisa','rupee','rupees','expensive','payment','pay','paid','free','is it free','joining fee','membership fee','semester fee','subscription','kitna','kitne','kitni','₹','500','fees kitni hai','chargeable','how much does it cost','how much is it','how much to join','cost to join','membership cost','dac fee','dac fees'],
    a:"Membership is <b>₹500 per semester</b>. 💸<br><br>That's it — no hidden extras. It goes straight into the events, workshops and project resources you'll be using.<br><br>It's collected each semester for as long as you're an active member, and you confirm it on the form before you submit — so nothing sneaks up on you.",
    chips:['What do I get for ₹500?','How do I join?','What events are coming up?'] },

  /* ── joining ────────────────────────────────────────────────── */
  { id:'join',
    keys:['how do i join','how to join','join dac','apply','application','sign up','signup','register','registration','become a member','membership','i want to join','joining process','apply now','enroll','admission to dac','join karna hai','kaise join'],
    a:"Three minutes, three steps. 🚀<br><br><ol style='margin:.4rem 0;padding-left:1.1rem'><li><b>About you</b> — name, DGU email, phone. We send you a code to verify the email.</li><li><b>Your studies</b> — year, programme, enrollment number.</li><li><b>Why you</b> — tell us what you'd actually build.</li></ol>Then you're in the queue, and we email you back.<br><br><a href='./join-dac.html'><b>→ Apply here</b></a>",
    chips:['What does it cost?','Who can join?','Why do I need an OTP?','What do I get?'] },

  { id:'eligibility',
    keys:['who can join','eligibility','eligible','am i eligible','can i join','requirements','prerequisite','do i need experience','no experience','beginner','first year','any branch','non technical','not a coder','non cs','arts student','commerce student','which year','coding','code','coder','programming','python','developer','technical background','do i need to code','know coding','need coding','without coding','no coding','skills required','qualification'],
    a:"<b>Anyone at DGU.</b> Any year, any programme, any branch. 🙌<br><br>You do <b>not</b> need prior AI experience. Some of our best members came in not knowing how to code — we have a design track, an events track, an outreach track and a research track for exactly that reason.<br><br>You just need a <b>@dgu.ac.in email address</b>.<br><br>Not from DGU? Then look at the <a href='./campus-ambassador.html'>Campus Ambassador programme</a> — it's open to <i>any</i> college.",
    chips:['How do I join?','Campus Ambassador','What does it cost?'] },

  { id:'email',
    keys:['dgu email','college email','why otp','otp','verification','verify','code','one time password','didnt get otp','otp not received','email not working','gmail','personal email','which email'],
    a:"You'll need your <b>@dgu.ac.in</b> address — a personal Gmail won't work. That's how we confirm you're actually a DGU student.<br><br>When you hit <b>Verify</b>, we email you a <b>6-digit code</b>. Type it in and you're through — it verifies the moment the sixth digit lands.<br><br><b>Code not arriving?</b> Check spam, wait 60 seconds, then hit <i>Send a new code</i>. Still nothing? Email <a href='mailto:dac@dgu.ac.in'>dac@dgu.ac.in</a> and a human will sort you out.",
    chips:['How do I join?','Contact a human'] },

  /* ── what you get ───────────────────────────────────────────── */
  { id:'benefits',
    keys:['what do i get','benefits','perks','why join','whats in it for me','advantages','what will i learn','value','worth it','why should i join','offerings','what do you offer','usp'],
    a:"Six things, and none of them is a certificate you frame and forget:<ul><li><b>R&amp;D opportunities</b> — research with faculty mentors. Ideate, prototype, publish.</li><li><b>Live projects &amp; internships</b> — real briefs, and we open doors through our industry network.</li><li><b>AI tools, hands-on</b> — guided labs on the platforms we actually use.</li><li><b>Industry access</b> — sessions and mentorship from people already doing the work.</li><li><b>Inter-campus events</b> — you help run hackathons and workshops at national scale.</li><li><b>Vibe coding platforms</b> — go from idea to working prototype, fast.</li></ul>",
    chips:['Tell me about internships','Tell me about projects','How do I join?','What AI tools do I get?'] },

  { id:'internship',
    keys:['internship','internships','help with internship','job','jobs','placement','placements','career','hiring','work experience','intern','recruit','opportunities','opportunity'],
    a:"Yes — <b>internship assistance</b> is one of the six core offerings. 💼<br><br>We work on live industry briefs and help members land internships through our partner network (7+ industry connections and growing). We also run <b>CXO networks</b> and industry relations specifically to open mentorship and internship doors.<br><br>To be blunt: the members who ship things are the ones who get introduced. Turn up and build.<br><br>For DGU's official placement figures, check <a href='https://dgu.ac.in' target='_blank' rel='noreferrer'>dgu.ac.in</a> — I won't quote numbers I can't verify.",
    chips:['Tell me about projects','How do I join?','Who are your partners?'] },

  { id:'certificate',
    keys:['certificate','certification','lor','letter of recommendation','recommendation','resume','cv','proof','credential'],
    a:"Campus Ambassadors get an <b>official certificate</b> and a <b>letter of recommendation</b> from DBS Global University for the work they actually do. 📜<br><br>Note the wording — <i>for the work they actually do</i>. It's not a participation badge; it reflects what you built and ran.",
    chips:['Campus Ambassador','How do I join?','What do I get?'] },

  /* ── projects ───────────────────────────────────────────────── */
  { id:'projects',
    keys:['projects','project','what are you building','what do you build','products','building','micro project','macro project','portfolio','work'],
    a:"Real software, shipped by members. 🛠️<br><br><b>Micro projects</b><ul><li><b>Admission Consultant</b> — an AI admissions funnel: lead capture, counsellor calling, call analysis.</li><li><b>PG Platform</b> — verified paying-guest accommodation around campus.</li><li><b>Automation Flow</b> — internal workflows that kill manual admin work.</li></ul><b>Macro projects</b><ul><li><b>Medical Industry</b> — diagnostics support, patient-flow analytics.</li><li><b>Business Intelligence Platform</b> — live dashboards and forecasts for leadership.</li></ul>",
    chips:['How do I join?','Tell me about internships','What AI tools do I get?'] },

  /* ── events ─────────────────────────────────────────────────── */
  { id:'events',
    keys:['events','event','whats coming up','upcoming','calendar','schedule','whats happening','activities','workshops','meetups','programs','agenda','dates'],
    a:"Four things on the calendar. 📅<ul><li><b>10 August</b> — <b>AI Startup Meetup</b> @ DBS Global University</li><li><b>20 August</b> — <b>Official First Meeting of DAC</b></li><li><b>5 September</b> — <b>DACathon 1.0</b>, our 36-hour AI hackathon</li><li><b>18 October</b> — <b>AI Content Competition</b> @ Nainital</li></ul>Ask me about any of them — the Nainital one has a twist you'll like.",
    chips:['Tell me about DACathon','Whats the Nainital trip?','AI Startup Meetup','How do I join?'] },

  { id:'dacathon',
    keys:['dacathon','hackathon','hack','dacathon 1.0','36 hour','coding competition','5 september','sept 5','september'],
    a:"<b>DACathon 1.0</b> — our flagship <b>36-hour AI hackathon</b>, on <b>5 September 2026</b>. ⚡<br><br>Form a team, pick a problem statement, and build a working AI prototype before the clock runs out. No slide decks. Something that runs.<br><br>It's the single best way to get noticed inside the Cell.",
    chips:['What events are coming up?','How do I join?','Whats the Nainital trip?'] },

  { id:'nainital',
    keys:['nainital','trip','content competition','video','film','18 october','october','content creation','refund','free trip','outing'],
    a:"<b>AI Content Creation Competition @ Nainital</b> — <b>18 October 2026</b>. 🏔️<br><br>Here's the hook: you go to Nainital, capture footage, and use AI tools to cut a <b>60-second cinematic video</b>. The most creative AI-edited film wins a <b>full refund of the trip fee</b>.<br><br>So the best entry effectively goes on holiday for free. Not a bad deal.",
    chips:['What events are coming up?','How do I join?','What AI tools do I get?'] },

  { id:'meetup',
    keys:['startup meetup','ai startup meetup','10 august','aug 10','meetup','startup','investors','entrepreneurs','founders','networking event','pitch'],
    a:"<b>AI Startup Meetup by DAC</b> — <b>10 August 2026</b>, at DBS Global University. 🚀<br><br>Open to <b>universities, students, startup owners, entrepreneurs and investors</b>. On the table: networking, expert sessions, mentorship, startup showcases and funding opportunities — all under one roof.<br><br><i>Where ideas meet intelligence. Where startups find the future.</i><br><br><b>Build. Connect. Transform.</b>",
    chips:['What events are coming up?','How do I join?','Become a partner'] },

  { id:'firstmeeting',
    keys:['first meeting','official first meeting','20 august','aug 20','induction','orientation','kickoff','onboarding'],
    a:"<b>Official First Meeting of DAC</b> — <b>20 August 2026</b>. 🎯<br><br>Meet the core team, see the upcoming projects and events, find the people you'll be building with, and pick your track.<br><br>If you apply now, this is the room you'll walk into.",
    chips:['How do I join?','What events are coming up?','What do I get?'] },

  /* ── partners & tools ───────────────────────────────────────── */
  { id:'aipartners',
    keys:['ai partners','partners','tools','which tools','ai tools','what tools','software','claude','julius','zapier','n8n','jasper','genspark','botpress','elevenlabs','base44','free tools','what ai do you use','tech stack'],
    a:"This is my favourite bit: <b>AI collabs and recommendations for every student, faculty member and staff member — at zero cost.</b> 🎁<br><br><b>Deep collaborations</b><ul><li><b>Claude</b> — research, automation and deployment across the university</li><li><b>Julius</b> — advanced research and model experimentation</li></ul><b>Recommended tools</b><ul><li><b>Base44</b> — vibe coding / rapid prototyping</li><li><b>Zapier</b> &amp; <b>n8n</b> — automation</li><li><b>Jasper</b> — research communication</li><li><b>Genspark</b> — research &amp; teaching</li><li><b>Botpress</b> — campus chatbots</li><li><b>ElevenLabs</b> — voice agents</li></ul>",
    chips:['What do I get?','How do I join?','Tell me about projects'] },

  { id:'resources',
    keys:['resources','adobe','firefly','photoshop','canva','notion','perplexity','copilot','odoo','free software','student tools','which apps'],
    a:"There's a whole toolkit, sorted by what you're trying to do:<ul><li><b>Design &amp; images</b> — Adobe Firefly, Express, Photoshop</li><li><b>Presentations</b> — Prezi, Notebook LM, Canva Magic Studio, Kimi</li><li><b>Research</b> — Perplexity, Claude, Genspark</li><li><b>Strategy</b> — Copilot, Gemini</li><li><b>Organisation</b> — Notion</li><li><b>Prototyping</b> — Rork.ai</li><li><b>Business ops</b> — Odoo ERP</li></ul>All of it is on the <a href='./index.html#resources'>Resources section</a> of the site.",
    chips:['What AI tools do I get?','What do I get?','How do I join?'] },

  /* ── team ───────────────────────────────────────────────────── */
  { id:'team',
    keys:['team','who runs dac','who runs','who runs this','who leads','runs','run','leads','lead','heads','head','incharge','in charge','patrons','patron','faculty','leadership','who is in charge','members of team','core team','staff','professors','tushar','puneet','merry','aman','bisht','srivastava','mohit','jasola','bhardwaj'],
    a:"<b>Patrons</b><ul><li><b>Prof. Tushar Srivastava</b> — Founding Patron</li><li><b>Prof. Puneet Kumar</b> — Patron</li><li><b>Prof. Merry</b> — Co-Patron</li><li><b>Prof. Aman Bisht</b> — Patron</li></ul><b>Under the guidance of</b><ul><li><b>Mr. Mohit Aggarwal</b> — President, DGU</li><li><b>Dr. Sanjay Jasola</b> — Vice Chancellor</li><li><b>Dr. Rajeev Bhardwaj</b> — Pro Vice Chancellor</li></ul>You can see them all on the <a href='./index.html#team'>Team section</a>.",
    chips:['How is DAC structured?','How do I join?','Contact a human'] },

  { id:'structure',
    keys:['structure','hierarchy','organisation','organization','roles','positions','levels','president','secretary','supervisor','coordinator','treasurer','office bearers','who leads','ranks'],
    a:"Four levels, each with a clear remit:<ul><li><b>Level I — Leadership:</b> President, Vice President, Treasurer</li><li><b>Level II — Administration:</b> General Secretary, Joint Secretary</li><li><b>Level III — Operations:</b> Supervisors (Events, Media, Tech, Outreach)</li><li><b>Level IV — Execution:</b> Coordinators (Domain, Project, Logistics)</li></ul>Level IV Coordinators are recruited <b>every semester</b> through an open application — so there's a way up if you want it.<br><br>Full detail: <a href='./terms.html#s4'>Terms &amp; Conditions</a>.",
    chips:['How do I join?','Are there elections?','Who runs DAC?'] },

  { id:'elections',
    keys:['elections','election','voting','vote','become president','leadership role','how to lead','appointed','contest','promotion'],
    a:"Level I positions are elected by <b>secret ballot</b> at the end of each academic year, overseen by the Faculty Advisor. 🗳️<br><br>Any active member with <b>at least one full semester of service</b> can contest. So join now, do the work, and you're eligible next year.<br><br>Secretaries and Supervisors are appointed by the incoming leadership; Coordinators are recruited openly each semester.",
    chips:['How is DAC structured?','How do I join?'] },

  /* ── campus ambassador ──────────────────────────────────────── */
  { id:'ambassador',
    keys:['campus ambassador','ambassador','ambassadors','campus','represent','representative','other college','another college','not from dgu','different university','my college','outside dgu','ca program','ambassador programme','can i represent','other university'],
    a:"<b>Campus Ambassador</b> — this one's for you if you're at <b>any other college</b>. Doesn't have to be DGU. 🌍<br><br>You run DAC where we can't be: host workshops and hack nights, build an AI community on your campus. We give you the material, the speakers and the network.<br><br>You get: a <b>certificate and LOR</b>, a direct line to the core team, and first access to everything before it goes public.<br><br><b>No prior AI experience needed.</b><br><br><a href='./campus-ambassador.html'><b>→ Apply here</b></a>",
    chips:['Who can join?','What events are coming up?','Contact a human'] },

  /* ── partnerships ───────────────────────────────────────────── */
  { id:'partner',
    keys:['partner','partnership','company','business','collaborate','collaboration','sponsor','sponsorship','industry','startup partner','institution','advisor','mou','tie up','work with you','recruit students','hire'],
    a:"Three ways to work with us: 🤝<ul><li><b>Industry Advisor</b> — for senior professionals, founders and domain experts who want to guide our direction.</li><li><b>Institutional Partnership</b> — for universities, colleges and research bodies.</li><li><b>Industry Partnership</b> — for companies and startups who want live projects, internships or access to emerging AI talent.</li></ul>Registering creates <b>no automatic financial obligation</b> — but there is a <b>one-year minimum commitment</b>, so read the terms first.<br><br><a href='./become-a-partner.html'><b>→ Become a partner</b></a> &middot; <a href='./partner-terms.html'>Partner Terms</a>",
    chips:['Whats the one-year lock-in?','Book a meeting','Contact a human'] },

  { id:'lockin',
    keys:['lock in','lockin','lock-in','one year','minimum commitment','1 year','can i withdraw','withdraw from partnership','exit','cancel partnership','terminate','partner terms','withdraw','break the partnership','opt out','leave partnership'],
    a:"Straight answer: <b>yes, there's a one-year lock-in.</b> ⏳<br><br>Once a partnership is confirmed it runs for a <b>minimum of 12 months</b>. You can't withdraw early <i>unless</i> DAC leadership and the Faculty Advisor agree in writing, or DAC terminates it for cause.<br><br>We put this front and centre rather than buried in clause 9 — nobody should be surprised by it.<br><br>Full terms: <a href='./partner-terms.html'>Partner Terms &amp; Conditions</a>.",
    chips:['Become a partner','Book a meeting'] },

  /* ── meeting / contact ──────────────────────────────────────── */
  { id:'meeting',
    keys:['book a meeting','meeting','call','schedule a call','talk to someone','speak to someone','appointment','calendly','book','consultation','discuss'],
    a:"Easiest thing in the world — <a href='./book-meeting.html'>pick a slot</a> and you're in. 📆<br><br>It's a <b>20-minute conversation</b>, online or on campus. Students, faculty, companies and other institutions all book these.<br><br>And you'll get a real answer — next steps, a name to follow up with, or a straight no. Not <i>\"we'll get back to you\"</i>.",
    chips:['Contact a human','Become a partner','How do I join?'] },

  { id:'contact',
    keys:['contact','email','reach you','get in touch','phone','whatsapp','instagram','linkedin','social','socials','twitter','youtube','follow','address','talk to human','speak to human','support'],
    a:"Come and say hi: 📬<ul><li><b>Email</b> — <a href='mailto:dac@dgu.ac.in'>dac@dgu.ac.in</a></li><li><b>WhatsApp</b> — <a href='https://wa.me/send?phone=919205072074' target='_blank' rel='noreferrer'>+91 92050 72074</a></li><li><b>Instagram</b> — <a href='https://instagram.com/dac.dgu' target='_blank' rel='noreferrer'>@dac.dgu</a></li><li><b>LinkedIn</b> — <a href='https://www.linkedin.com/in/dgu-ai-cell-a3049640a/' target='_blank' rel='noreferrer'>DGU AI Cell</a></li><li><b>YouTube</b> — <a href='https://youtube.com/@DACXDGU' target='_blank' rel='noreferrer'>@DACXDGU</a></li></ul>Or just <a href='./book-meeting.html'>book 20 minutes</a> with an actual human.",
    chips:['Book a meeting','How do I join?'] },

  { id:'location',
    keys:['where','location','address','campus','dehradun','how to reach','directions','which city','situated','based'],
    a:"We're at <b>DBS Global University, Dehradun</b>, Uttarakhand. 📍<br><br>Most of what we do happens on campus — but Campus Ambassadors run DAC from colleges all over the country, and meetings can be online.<br><br>Directions and the official campus address are on <a href='https://dgu.ac.in' target='_blank' rel='noreferrer'>dgu.ac.in</a>.",
    chips:['Book a meeting','Contact a human','How do I join?'] },

  /* ── award ──────────────────────────────────────────────────── */
  { id:'award',
    keys:['award','awards','recognition','business world','achievement','did you win','have you won','won any award','win any award','prize','best use of ai','accolade','smart university','trophy'],
    a:"We won <b>Best Use of AI in Higher Education in India</b> 🏆 — at the <b>Business World Smart University Awards 2026</b>.<br><br>It was received by <b>Mr. Mohit Aggarwal</b>, President of DGU, and it recognises university-wide adoption of AI across teaching, research and administration.<br><br>Not a bad thing to have on your CV as a member, honestly.",
    chips:['What is DAC?','How do I join?','Whats DGU like?'] },

  /* ── ethics & rules ─────────────────────────────────────────── */
  { id:'ethics',
    keys:['ethics','responsible ai','ai ethics','deepfake','rules','guidelines','pledge','plagiarism','academic integrity','cheating','misuse','privacy','bias'],
    a:"We take this properly seriously — it's <b>mandatory, not aspirational</b>. ⚖️<br><br>Seven principles: <b>Transparency, Fairness, Privacy, Accountability, Safety, Human Oversight, Sustainability</b>.<br><br>Hard lines:<ul><li><b>Deepfakes and deceptive synthetic media are banned</b> — treated as Gross Misconduct.</li><li>You may not pass AI work off as entirely your own academically.</li><li>Confidential university data never goes into an external AI tool without written approval.</li><li><i>\"The AI decided\"</i> is never an acceptable excuse. A human owns every outcome.</li></ul>Every member signs the <b>AI Ethics Pledge</b> on joining and each semester.<br><br>Full framework: <a href='./terms.html#s5'>Terms &amp; Conditions</a>.",
    chips:['Terms and conditions','How do I join?','What is DAC?'] },

  { id:'terms',
    keys:['terms','conditions','t&c','tnc','policy','legal','rules and regulations','disciplinary','attendance','code of conduct','punishment','suspension'],
    a:"It's all written down — no surprises. 📋<br><br>The <a href='./terms.html'>Terms &amp; Conditions</a> cover membership, the code of conduct, the AI ethics framework, the disciplinary process, meetings and elections.<br><br>Two that catch people out:<ul><li><b>85% attendance</b> at meetings relevant to your level.</li><li>Reimbursement claims need original receipts within <b>7 days</b>.</li></ul>",
    chips:['What is responsible AI?','How is DAC structured?','How do I join?'] },

  { id:'meetings',
    keys:['meetings','how often','frequency','weekly','monthly','time commitment','how much time','busy','hours per week','commitment'],
    a:"The rhythm:<ul><li><b>General Body Meetings</b> — monthly</li><li><b>Executive Reviews</b> — bi-weekly</li><li><b>Operational Syncs</b> — weekly</li><li><b>Domain team meetings</b> — as needed</li></ul>You're expected at <b>85% of the meetings relevant to your level</b> — with 12 hours' notice if you can't make one.<br><br>Honest version: it's a real commitment, not a society you join and forget. That's rather the point.",
    chips:['Terms and conditions','How do I join?','What do I get?'] },

  /* ── DGU (the university) ───────────────────────────────────── */
  { id:'dgu',
    keys:['dgu','dbs global','dbs global university','university','college','about dgu','what is dgu','tell me about the university','institute','campus'],
    a:"<b>DBS Global University (DGU)</b> is in Dehradun, Uttarakhand — and DAC is its official AI Cell.<br><br>DGU recently won <b>Best Use of AI in Higher Education in India</b> at the Business World Smart University Awards 2026, which tells you how seriously it's taking this.<br><br>For anything about the <b>university itself</b> — courses, admissions, fees, placements — go to <a href='https://dgu.ac.in' target='_blank' rel='noreferrer'><b>dgu.ac.in</b></a>. I only speak with authority about the AI Cell, and I'd rather point you to the official source than guess.",
    chips:['What is DAC?','What courses does DGU have?','How do I join?'] },

  { id:'dgucourses',
    keys:['courses','course','dgu courses','courses does dgu','what courses','programmes','programs','degree','degrees','btech','b.tech','bca','mba','bba','mca','bcom','llb','mtech','msc','bsc','pharma','branches','branch','streams','stream','which course','list of courses'],
    a:"Programmes I see students join DAC from: <b>B.Tech</b> (CSE, AI &amp; ML, Data Science, ECE, IT), <b>M.Tech</b>, <b>BCA</b>, <b>MCA</b>, <b>B.Sc</b>, <b>M.Sc</b>, <b>BBA</b>, <b>MBA</b>, <b>B.Com</b>, <b>BBA+MBA Integrated</b>, <b>BA/BBA+LLB</b>, <b>BLS</b> and <b>Pharma</b>.<br><br>And yes — <b>all of them can join DAC</b>. We are not a CS-only club.<br><br>For the official course list, eligibility and fees, check <a href='https://dgu.ac.in' target='_blank' rel='noreferrer'>dgu.ac.in</a>. I won't quote university fees I can't verify.",
    chips:['Who can join?','How do I join?','What do I get?'] },

  { id:'dguadmission',
    keys:['admission','admissions','admission fee','apply to dgu','get into dgu','entrance','cutoff','cut off','eligibility for dgu','scholarship','hostel','university fees','university fee','college fees','college fee','tuition','tuition fee','fee at dgu','fees at dgu','dgu fee','dgu fees','btech fee','course fee','semester fee dgu','placement package'],
    a:"That's <b>DGU admissions</b>, not DAC — and I'm not going to invent numbers for something that important. 🙅<br><br>Everything official (admissions, cutoffs, university fees, scholarships, hostel) is at <a href='https://dgu.ac.in' target='_blank' rel='noreferrer'><b>dgu.ac.in</b></a>.<br><br>Once you're <i>in</i> DGU though — come find me. Joining DAC is the easy bit. 😄",
    chips:['How do I join DAC?','What is DAC?','Contact a human'] },
  ];

  /* ═══════════════════ MATCHING ENGINE ═══════════════════
     Not keyword lookup. Phrases outrank words, typos are tolerated,
     stopwords are ignored, and low confidence means we DON'T answer. */

  const STOP = new Set(['the','a','an','is','are','am','was','were','be','do','does','did','can','could',
    'i','you','he','she','it','we','they','me','my','your','our','their','this','that','these','those',
    'to','of','for','in','on','at','by','with','from','and','or','but','if','so','as','about','tell',
    'what','whats','how','when','where','which','who','whom','whose','why','please','pls','hey','ok',
    'okay','just','some','any','get','got','know','want','need','would','should','will','shall','there',
    'here','have','has','had','more','much','many','also','into','out','up','down','over','plz','ka','ki',
    'ke','hai','ho','kya','mein','me']);

  const norm = s => (s || '').toLowerCase()
    .replace(/[^\w\s₹&+.@-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const stem = w => w
    .replace(/(ies)$/, 'y')
    .replace(/(sses|shes|ches|xes)$/, '')
    .replace(/([^s])s$/, '$1')
    .replace(/(ing|ed)$/, '');

  const tokens = s => norm(s).split(' ')
    .filter(w => w && !STOP.has(w))
    .map(stem)
    .filter(w => w.length > 1);

  /* Levenshtein — so "amabssador" and "dacthon" still land */
  function lev(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 2) return 9;
    const m = a.length, n = b.length;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(
          prev[j] + 1,
          cur[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
      prev = cur;
    }
    return prev[n];
  }

  // pre-index the knowledge base once
  KB.forEach(k => {
    k._phrases = k.keys.filter(x => x.includes(' ')).map(norm);
    k._words   = new Set(k.keys.filter(x => !x.includes(' ')).map(x => stem(norm(x))));
  });

  /* Words that mean "the university", "money", and "the club" respectively. */
  const RE_UNI  = /\b(dgu|dbs|university|universities|college|colleges|tuition|admission|admissions|hostel|scholarship|cutoff|entrance|semester fee)\b/;
  const RE_MONEY= /\b(fee|fees|cost|costs|price|pricing|tuition|charges|expensive|much|paisa|kitna|kitni)\b/;
  const RE_DAC  = /\b(dac|ai cell|cell|club|membership|member|join)\b/;

  function match(q) {
    const raw = norm(q);
    const toks = tokens(q);
    if (!raw) return null;

    /* ── SAFETY RULE ──────────────────────────────────────────────────
       "How much is DGU tuition?" must NEVER be answered with "₹500" — that's
       DAC's membership fee, and a student could act on the confusion. Any
       question mixing a university word with a money word, that isn't about
       DAC itself, is routed to the admissions answer, which quotes no figures
       and sends them to dgu.ac.in. This is a rule, not a scoring outcome. */
    if (RE_UNI.test(raw) && RE_MONEY.test(raw) && !RE_DAC.test(raw)) {
      const k = KB.find(x => x.id === 'dguadmission');
      if (k) return { hit: k, score: 99, runner: null };
    }

    let best = null, bestScore = 0, bestSpec = 0, runner = null;

    for (const k of KB) {
      let score = 0, spec = 0;

      // whole phrases are the strongest signal
      for (const p of k._phrases) {
        if (raw.includes(p)) {
          score += 6 + p.split(' ').length;
          spec = Math.max(spec, p.length);
        }
      }

      // exact word hits
      for (const t of toks) {
        if (k._words.has(t)) { score += 3; spec = Math.max(spec, t.length); }
      }

      // typo tolerance on whatever didn't match exactly
      for (const t of toks) {
        if (k._words.has(t)) continue;
        if (t.length < 4) continue;
        for (const w of k._words) {
          if (Math.abs(w.length - t.length) > 2) continue;
          if (lev(t, w) <= (t.length > 6 ? 2 : 1)) {
            score += 2.5;
            spec = Math.max(spec, w.length * 0.8);
            break;
          }
        }
      }

      k._s = score;

      /* Tie-break on SPECIFICITY, not on list order.
         Without this, "what's the B.Tech admission fee at DGU" answered "₹500"
         — the DAC membership fee — because 'fee' and 'admission' both scored 3
         and 'fees' happened to be listed first. A student could act on that.
         Now the longer, more specific term wins: 'admission' > 'fee'. */
      if (score > bestScore || (score === bestScore && score > 0 && spec > bestSpec)) {
        if (best && bestScore > 0) runner = best;
        best = k; bestScore = score; bestSpec = spec;
      } else if (score > 0 && (!runner || score > (runner._s || 0))) {
        runner = k;
      }
    }

    // Not confident? Then don't pretend. This is the whole point of the thing.
    if (!best || bestScore < 2.5) return null;
    return { hit: best, score: bestScore, runner: runner };
  }

  /* ═══════════════════ FALLBACK ═══════════════════ */
  const FALLBACKS = [
    "Hmm — that one's outside my head. 🤔 And I'd rather admit it than invent an answer you might act on.",
    "You've got me. I genuinely don't know that one — and I'm not going to guess.",
    "That's beyond what I've been taught, and I won't bluff it."
  ];

  function fallback(q) {
    logMiss(q);
    const line = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    return {
      a: line + "<br><br>Email <a href='mailto:dac@dgu.ac.in'>dac@dgu.ac.in</a> and a human will answer properly — or <a href='./book-meeting.html'>book 20 minutes</a> with the team.<br><br>Meanwhile, here's what I <i>am</i> good at:",
      chips: ['What is DAC?', 'How do I join?', 'What does it cost?', 'What events are coming up?', 'Become a partner']
    };
  }

  /* Quietly tell the team what people asked that I couldn't answer,
     so the bot gets smarter over time. Rate-limited, never blocking. */
  let lastLog = 0;
  function logMiss(q) {
    if (!LOG_URL) return;
    const now = Date.now();
    if (now - lastLog < 8000) return;          // no spamming the sheet
    if (!q || q.length < 3 || q.length > 200) return;
    lastLog = now;
    try {
      fetch(LOG_URL, {
        method: 'POST', mode: 'no-cors',
        body: JSON.stringify({
          "Form": "Bot Questions",
          "Question": q,
          "Page": location.pathname,
          "Submitted At": new Date().toLocaleString()
        })
      }).catch(() => {});
    } catch (e) {}
  }

  /* ═══════════════════ UI ═══════════════════ */
  const $ = id => document.getElementById(id);
  const fab = $('dacbFab'), panel = $('dacbPanel'), body = $('dacbBody'),
        menu = $('dacbMenu'), browse = $('dacbBrowse'), teaser = $('dacbTeaser');

  /* ── the full question list. No typing: every route into an answer is a
        button, so a typo can never produce "sorry, I don't know that". ── */
  const MENU = [
    ['Getting started', [
      ['about',       'What is DAC?'],
      ['vision',      'What is the vision and mission?'],
      ['stats',       'How big is DAC?'],
      ['award',       'Has DAC won anything?'] ]],
    ['Joining', [
      ['join',        'How do I join?'],
      ['fees',        'What does it cost?'],
      ['eligibility', 'Am I eligible?'],
      ['email',       'Why do you need my college email?'],
      ['lockin',      'What is the one-year commitment?'] ]],
    ['What you get', [
      ['benefits',    'What do members actually get?'],
      ['certificate', 'Do I get a certificate?'],
      ['internship',  'Are there internships?'],
      ['resources',   'What resources do I get access to?'],
      ['aipartners',  'Which AI tools do you give away?'] ]],
    ['Events & projects', [
      ['events',      'What events are coming up?'],
      ['dacathon',    'Tell me about DACathon'],
      ['nainital',    'What is the Nainital trip?'],
      ['meetup',      'What happens at a meetup?'],
      ['firstmeeting','What is the first meeting like?'],
      ['projects',    'What projects do members build?'] ]],
    ['Who runs DAC', [
      ['team',        'Who is on the team?'],
      ['structure',   'How is DAC structured?'],
      ['elections',   'How do elections work?'],
      ['meetings',    'How often do you meet?'] ]],
    ['Programmes', [
      ['ambassador',  'What is the Campus Ambassador programme?'],
      ['partner',     'How can my company partner with DAC?'] ]],
    ['Rules & conduct', [
      ['ethics',      'What are your AI ethics rules?'],
      ['terms',       'What are the terms and conduct rules?'] ]],
    ['Reach us', [
      ['meeting',     'How do I book a meeting?'],
      ['contact',     'How do I contact DAC?'],
      ['location',    'Where are you based?'] ]],
    ['About DGU', [
      ['dgu',         'Tell me about DBS Global University'],
      ['dgucourses',  'What courses does DGU offer?'],
      ['dguadmission','How do DGU admissions work?'] ]],
    ['Just for fun', [
      ['whoareyou',   'Who are you?'],
      ['areyouai',    'Are you a real AI?'],
      ['whobuilt',    'Who built you?'],
      ['joke',        'Tell me a joke'] ]]
  ];
  if (!fab || !panel) return;

  let opened = false;

  const scroll = () => { body.scrollTop = body.scrollHeight; };

  function addBot(html, chips) {
    const d = document.createElement('div');
    d.className = 'dacb-msg dacb-bot';
    d.innerHTML = html;
    body.appendChild(d);
    if (chips && chips.length) {
      const c = document.createElement('div');
      c.className = 'dacb-chips';
      chips.forEach(t => {
        const b = document.createElement('button');
        b.className = 'dacb-chip';
        b.type = 'button';
        b.textContent = t;
        b.onclick = () => { c.remove(); ask(t); };
        c.appendChild(b);
      });
      body.appendChild(c);
    }
    scroll();
  }

  function addMe(text) {
    const d = document.createElement('div');
    d.className = 'dacb-msg dacb-me';
    d.textContent = text;
    body.appendChild(d);
    scroll();
  }

  function typing(on) {
    const old = $('dacbTyping');
    if (old) old.remove();
    if (!on) return;
    const t = document.createElement('div');
    t.className = 'dacb-typing';
    t.id = 'dacbTyping';
    t.innerHTML = '<i></i><i></i><i></i>';
    body.appendChild(t);
    scroll();
  }

  function ask(q) {
    q = (q || '').trim();
    if (!q) return;
    addMe(q);
    closeMenu();
    typing(true);

    // a beat of "thinking" — it reads as alive, and it's still ~20x faster than an LLM
    const delay = 320 + Math.min(q.length * 12, 380);
    setTimeout(() => {
      typing(false);
      const m = match(q);
      if (m) {
        const chips = (m.hit.chips || []).slice();
        // offer the runner-up too, if it was a close call — cheap disambiguation
        if (m.runner && m.runner._s >= m.score * 0.75 && m.runner.chips) {
          const extra = m.runner.chips[0];
          if (extra && chips.indexOf(extra) === -1 && chips.length < 4) chips.push(extra);
        }
        addBot(m.hit.a, chips);
      } else {
        const f = fallback(q);
        addBot(f.a, f.chips);
      }
    }, delay);
  }

  function open() {
    panel.classList.add('on');
    fab.classList.add('open');
    fab.setAttribute('aria-expanded', 'true');
    hideTeaser();
    if (!opened) {
      opened = true;
      setTimeout(() => {
        addBot(
          "Hey! 👋 I'm <b>DAC</b> — the AI Cell's assistant.<br><br>Tap a question below, or hit <b>Browse all questions</b> for the full list.<br><br>What do you want to know?",
          ['What is DAC?', 'How do I join?', 'What does it cost?', 'What events are coming up?']
        );
      }, 280);
    }
  }

  function close() {
    panel.classList.remove('on');
    fab.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
  }

  function hideTeaser() {
    if (teaser) teaser.classList.remove('on');
    try { sessionStorage.setItem('dacb-teased', '1'); } catch (e) {}
  }

  fab.onclick = () => panel.classList.contains('on') ? close() : open();
  $('dacbClose').onclick = close;
  /* answer straight from a known id — no fuzzy matching, no misses */
  function askId(id, label) {
    addMe(label);
    closeMenu();
    typing(true);
    setTimeout(() => {
      typing(false);
      let hit = null;
      for (let i = 0; i < KB.length; i++) if (KB[i].id === id) { hit = KB[i]; break; }
      if (hit) addBot(hit.a, hit.chips);
      else { const f = fallback(label); addBot(f.a, f.chips); }
    }, 420);
  }

  function buildMenu() {
    if (!menu || menu.firstChild) return;
    const wrap = document.createElement('div');
    wrap.className = 'dacb-menu-in';
    MENU.forEach(sec => {
      const h = document.createElement('div');
      h.className = 'dacb-cat';
      h.textContent = sec[0];
      wrap.appendChild(h);
      sec[1].forEach(q => {
        const b = document.createElement('button');
        b.className = 'dacb-q';
        b.type = 'button';
        b.textContent = q[1];
        b.onclick = () => askId(q[0], q[1]);
        wrap.appendChild(b);
      });
    });
    menu.appendChild(wrap);
  }

  function openMenu()  { buildMenu(); menu.classList.add('on');
                         browse.setAttribute('aria-expanded', 'true'); menu.scrollTop = 0; }
  function closeMenu() { if (!menu) return; menu.classList.remove('on');
                         if (browse) browse.setAttribute('aria-expanded', 'false'); }

  if (browse) browse.onclick = () => menu.classList.contains('on') ? closeMenu() : openMenu();
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('on')) close();
  });

  if (teaser) {
    teaser.onclick = open;
    teaser.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') open(); };
    let teased = false;
    try { teased = sessionStorage.getItem('dacb-teased') === '1'; } catch (e) {}
    if (!teased) {
      setTimeout(() => {
        if (!panel.classList.contains('on')) {
          teaser.classList.add('on');
          setTimeout(hideTeaser, 9000);
        }
      }, 6000);
    }
  }
})();
