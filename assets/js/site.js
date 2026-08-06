/* ==========================================================================
   DAC — shared page behaviour
   Sticky nav + scroll progress bar, reveal-on-scroll, the burger menu and
   the cookie bar. Loaded by every page except join-dac.html, whose copy is
   tuned differently and also closes the OTP dialog on Escape.
   ========================================================================== */

const $ = id => document.getElementById(id);

addEventListener('scroll', () => {
  $('nav').classList.toggle('sc', scrollY > 20);
  const max = document.body.scrollHeight - innerHeight;
  $('bar').style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
}, { passive: true });

const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .06, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.rv').forEach((el, i) => {
  el.style.transitionDelay = Math.min(i * 50, 260) + 'ms';
  io.observe(el);
});

const menu = $('menu');
const setMenu = o => {
  menu.classList.toggle('open', o);
  $('burger').setAttribute('aria-expanded', o);
  document.body.style.overflow = o ? 'hidden' : '';
};
$('burger').onclick = () => setMenu(true);
$('menuX').onclick  = () => setMenu(false);
menu.querySelectorAll('a').forEach(a => a.onclick = () => setMenu(false));
addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

const CK = 'dac-cookie-consent';
const store = {
  get(){ try { return localStorage.getItem(CK); } catch { return null; } },
  set(v){ try { localStorage.setItem(CK, v); } catch {} }
};
if (!store.get()) setTimeout(() => $('ck').classList.add('on'), 1200);
$('ckA').onclick = () => { store.set('accepted'); $('ck').classList.remove('on'); };
$('ckD').onclick = () => { store.set('declined'); $('ck').classList.remove('on'); };
