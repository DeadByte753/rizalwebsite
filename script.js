const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop = matchMedia('(min-width: 901px)');
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

/* menu */
const menuBtn = $('#menuBtn'), links = $('#links');
menuBtn.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  onScroll();
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false');
}));

/* passport tilt */
const hero = $('#hero'), pass = $('#passport');
if (!reduce) {
  hero.addEventListener('mousemove', e => {
    const r = pass.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
    const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
    pass.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 18}deg)`;
    pass.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    pass.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  });
  hero.addEventListener('mouseleave', () => pass.style.transform = '');
}

/* reveal + counters */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); io.unobserve(e.target);
  const k = e.target.querySelector('[data-count]');
  if (k) countUp(k);
}), { threshold: .18 });
$$('.reveal').forEach(el => io.observe(el));
function countUp(el) {
  const end = +el.dataset.count, start = end > 100 ? end - 60 : 0, t0 = performance.now(), dur = reduce ? 1 : 1600;
  (function tick(t) {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(start + (end - start) * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

/* quote words */
const q = $('#quote');
q.innerHTML = q.innerHTML.replace(/<span class="hl">(.*?)<\/span>/, '§$1§')
  .split(' ').map(w => w.includes('§') ? `<span class="w hl">${w.replace(/§/g, '')}</span>` : `<span class="w">${w}</span>`).join(' ');
const words = $$('#quote .w');

/* horizontal journey */
const js = $('#journey'), track = $('#htrack'), cards = $$('.ccard'), stops = $$('.stop'), vfill = $('#vfill'), walker = $('#walker');
function sizeJourney() { js.style.height = desktop.matches ? (cards.length * 85) + 'vh' : ''; }
sizeJourney(); desktop.addEventListener('change', () => { sizeJourney(); onScroll(); });
const cardIO = new IntersectionObserver(es => es.forEach(e => { if (!desktop.matches && e.isIntersecting) e.target.classList.add('active'); }), { threshold: .2 });
cards.forEach(c => cardIO.observe(c));
stops.forEach(s => s.addEventListener('click', () => {
  const i = +s.dataset.i, total = js.offsetHeight - innerHeight;
  scrollTo({ top: js.offsetTop + total * (i / (cards.length - 1)) + 2, behavior: reduce ? 'auto' : 'smooth' });
}));

/* places map */
const pins = $$('.pin'), ptabs = $$('.place-info .tab'), pis = $$('.pi');
function showPlace(p) {
  pins.forEach(x => x.classList.toggle('sel', x.dataset.p == p));
  ptabs.forEach(x => x.setAttribute('aria-selected', x.dataset.p == p));
  pis.forEach(x => x.classList.toggle('show', x.dataset.p == p));
}
pins.forEach(pn => {
  pn.addEventListener('click', () => showPlace(pn.dataset.p));
  pn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPlace(pn.dataset.p); } });
});
ptabs.forEach(t => t.addEventListener('click', () => showPlace(t.dataset.p)));
showPlace(0);

/* scroll-driven elements */
const tlwrap = $('#tlwrap'), tlfill = $('#tlfill'), obsList = $('#obsList'), obsMeter = $('#obsMeter');
const nav = $('#nav'), bar = $('#progress'), totop = $('#totop'), ring = $('#ring');
const navLinks = $$('#links a'), secs = navLinks.map(a => $(a.getAttribute('href')));
const clamp = v => Math.min(1, Math.max(0, v));
let ticking = false;
function onScroll() {
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? y / max : 0;
  bar.style.transform = `scaleX(${p})`;
  nav.classList.toggle('scrolled', y > 40 || links.classList.contains('open'));
  totop.classList.toggle('show', y > 600);
  ring.style.strokeDashoffset = 157 * (1 - p);

  let cur = -1;
  secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = i; });
  navLinks.forEach((a, i) => a.classList.toggle('active', i === cur));

  if (desktop.matches) {
    const r = js.getBoundingClientRect(), total = js.offsetHeight - innerHeight;
    const jp = clamp(-r.top / total);
    track.style.transform = `translate3d(${-jp * (track.scrollWidth - innerWidth)}px,0,0)`;
    vfill.style.width = (jp * 100) + '%';
    walker.style.left = (jp * 100) + '%';
    const idx = Math.round(jp * (cards.length - 1));
    cards.forEach((c, i) => c.classList.toggle('active', i === idx));
    stops.forEach((s, i) => s.classList.toggle('on', i <= idx));
  }

  const qr = q.getBoundingClientRect();
  const qp = clamp((innerHeight * .85 - qr.top) / (innerHeight * .6));
  words.forEach((w, i) => w.classList.toggle('on', reduce || i < qp * words.length));

  const tr = tlwrap.getBoundingClientRect();
  tlfill.style.transform = `scaleY(${clamp((innerHeight * .6 - tr.top) / tr.height)})`;

  const or = obsList.getBoundingClientRect();
  obsMeter.style.width = clamp((innerHeight * .6 - or.top) / or.height) * 100 + '%';
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', onScroll);
onScroll();

totop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
$$('.flip').forEach(f => f.addEventListener('click', () => f.classList.toggle('flipped')));

/* magnetic buttons */
if (!reduce) $$('.btn').forEach(b => {
  b.addEventListener('mousemove', e => {
    const r = b.getBoundingClientRect();
    b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .2}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
  });
  b.addEventListener('mouseleave', () => b.style.transform = '');
});
