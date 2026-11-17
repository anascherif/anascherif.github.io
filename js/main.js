/* Anas Abdelmalek Cherif, portfolio. Motion and data. Needs GSAP, ScrollTrigger, Lenis. */
(() => {
  'use strict';

  const GITHUB_USER = 'anascherif';
  const HIDE_REPOS = ['anascherif'];
  const NEW_DAYS = 21;
  const REPO_LIMIT = 7;
  // Team repositories that live on a teammate's account. Shown under "Team projects and forks".
  const TEAM_REPOS = [
    { full: 'mohamedazizabbes/DRONATHON3.0', name: 'SKYFORGE', description: '1st place at DRONATHON 3.0, ENSIT 2026. Autonomous coastal rescue drone: ROS 2, LangGraph, PX4. Team of four.', html_url: 'https://github.com/mohamedazizabbes/DRONATHON3.0', language: 'Python', pushed_at: '2026-11-08T16:06:26Z', created_at: '2026-01-01T00:00:00Z' }
  ];
  // Order of my own repositories. Anything not listed here (a new repo) goes to the top automatically.
  const REPO_ORDER = ['AeroGraph', 'NlQuery', 'micromouse', 'net_tool', 'TeleWatch', 'DSA_and_CP', 'ana_cli'];
  // Used only when a repository has no description on GitHub.
  const REPO_NOTES = {
    micromouse: 'ESP32 maze-solving robot: flood-fill search, slalom trajectory control, ultrasonic mapping and IMU heading hold, plus a browser simulator.',
    DSA_and_CP: 'Data structures, algorithms and competitive programming practice.'
  };

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width: 992px)');
  const canHover = matchMedia('(hover: hover)').matches;

  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove('js'); return; }
  gsap.registerPlugin(ScrollTrigger);

  const flightOn = desktop.matches && !reduced;
  let lenis = null;

  /* ------------------------------------------------------------------ helpers */
  let refreshTimer = 0;
  function safeRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => { try { ScrollTrigger.refresh(); } catch (e) { console.error(e); } }, 80);
  }

  const rem = () => parseFloat(getComputedStyle(root).fontSize);
  // Data from the GitHub API is other people's text. Links built from it may only point at github.com.
  const ghUrl = (u) => (/^https:\/\/github\.com\/[\w.\-\/#?=&%]+$/.test(String(u)) ? String(u) : 'https://github.com/' + GITHUB_USER);
  const ghName = (n) => String(n).replace(/[^\w.\-]/g, '');

  function splitChars(el) {
    const chars = [];
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            [...tok].forEach((ch) => {
              const c = document.createElement('span'); c.className = 'c'; c.textContent = ch;
              w.appendChild(c); chars.push(c);
            });
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          if (n.hasAttribute('data-keep')) chars.push(n);
          else if (n.tagName !== 'BR') walk(n);
        }
      });
    };
    walk(el);
    if (/^H\d$/.test(el.tagName)) el.setAttribute('aria-label', label);
    return chars;
  }

  function splitLines(el) {
    const original = el.innerHTML;
    const items = [];
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.style.display = 'inline-block'; s.textContent = tok;
          frag.appendChild(s); items.push(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName === 'BR') items.push(null);
    });
    const lines = []; let cur = null; let top = null;
    items.forEach((w) => {
      if (!w) { cur = null; return; }
      const t = w.offsetTop;
      if (!cur || Math.abs(t - top) > 4) { cur = []; lines.push(cur); top = t; }
      cur.push(w.textContent);
    });
    el.textContent = '';
    const inner = lines.map((words) => {
      const ln = document.createElement('span'); ln.className = 'ln';
      const i = document.createElement('span'); i.className = 'ln__i'; i.textContent = words.join(' ');
      ln.appendChild(i); el.appendChild(ln); return i;
    });
    return { inner, revert: () => { el.innerHTML = original; } };
  }

  function ago(dateStr) {
    const d = (Date.now() - new Date(dateStr).getTime()) / 864e5;
    if (d < 1) return 'today';
    if (d < 2) return 'yesterday';
    if (d < 14) return Math.floor(d) + ' days ago';
    if (d < 60) return Math.floor(d / 7) + ' weeks ago';
    if (d < 365) return Math.floor(d / 30.4) + ' months ago';
    const y = Math.floor(d / 365);
    return y + (y === 1 ? ' year ago' : ' years ago');
  }

  /* ------------------------------------------------------------------ smooth scroll */
  function initLenis() {
    if (reduced || !window.Lenis) return;
    lenis = new Lenis({ duration: 0.9, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToEl(target, immediate) {
    let y = 0;
    if (target && target.id !== 'top') {
      const off = target.id === 'work' ? 0 : (desktop.matches ? -3 * rem() : -5 * 16);
      y = Math.max(0, target.getBoundingClientRect().top + window.scrollY + off);
    }
    if (lenis) lenis.scrollTo(y, { immediate: !!immediate, duration: 1.5 });
    else window.scrollTo({ top: y, behavior: immediate || reduced ? 'auto' : 'smooth' });
  }

  /* ------------------------------------------------------------------ hero flight */
  function initFlight() {
    root.classList.add('flight');
    const sticky = $('.hero__sticky');
    const brand = $('.brand');
    const side = $('.side');

    const pairs = $$('[data-fly]').map((el) => ({ el, ghost: $('[data-ghost="' + el.dataset.fly + '"]'), type: el.dataset.fly === 'cta' ? 'box' : 'text' }));
    pairs.push({ el: brand, ghost: $('[data-ghost="logo"]'), type: 'logo' });

    const ghostBox = (g) => {
      let x = 0, y = 0, n = g;
      while (n && n !== sticky) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x, y, w: g.offsetWidth, h: g.offsetHeight };
    };
    const realBox = (el, box) => {
      const s = el.style; const t = s.transform, w = s.width, h = s.height;
      s.transform = 'none'; if (box) { s.width = ''; s.height = ''; }
      const r = el.getBoundingClientRect();
      s.transform = t; if (box) { s.width = w; s.height = h; }
      return r;
    };
    const m = (p) => {
      const g = ghostBox(p.ghost); const r = realBox(p.el, p.type === 'box');
      return { x: g.x - r.left, y: g.y - r.top, s: p.type === 'logo' ? g.w / r.width : g.h / r.height, w: g.w, h: g.h, fw: r.width, fh: r.height };
    };

    const tl = gsap.timeline({
      defaults: { ease: 'power1.inOut', duration: 1 },
      scrollTrigger: {
        trigger: '.hero', start: 'top top', end: () => '+=' + window.innerHeight, scrub: true, invalidateOnRefresh: true,
        onUpdate: (self) => state(self.progress),
        onRefresh: (self) => state(self.progress)
      }
    });
    function state(p) {
      brand.style.zIndex = p > 0.56 ? 5 : 1;
      side.classList.toggle('is-live', p > 0.9);
    }

    pairs.forEach((p) => {
      if (p.type === 'box') {
        tl.fromTo(p.el,
          { x: () => m(p).x, y: () => m(p).y, width: () => m(p).w, height: () => m(p).h },
          { x: 0, y: 0, width: () => m(p).fw, height: () => m(p).fh, force3D: false }, 0);
      } else {
        tl.fromTo(p.el,
          { x: () => m(p).x, y: () => m(p).y, scale: () => m(p).s, '--k': 1 },
          { x: 0, y: 0, scale: 1, '--k': 0, force3D: false }, 0);
      }
    });

    tl.fromTo('.hero__body', { y: 0 }, { y: () => -window.innerHeight * 0.96, ease: 'none' }, 0)
      .fromTo('.hcard__bg, .hcard--c', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: 'none' }, 0)
      .fromTo('.hero__navg i', { scaleY: 1 }, { scaleY: 0, duration: 0.2 }, 0)
      .fromTo('[data-hl] .ln__i', { yPercent: 0 }, { yPercent: -110, duration: 0.24, stagger: 0.02, ease: 'power1.in' }, 0)
      .fromTo('.hero__btn2', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, ease: 'none' }, 0)
      .fromTo('.portrait img', { autoAlpha: 1, scale: 1, filter: 'blur(0px)' }, { autoAlpha: 0, scale: 1.05, filter: 'blur(34px)', duration: 0.52, ease: 'power1.in' }, 0.03)
      .fromTo('.backdrop', { opacity: 0 }, { opacity: 1, duration: 0.55, ease: 'none' }, 0.1)
      .fromTo(root, { '--rv': 0 }, { '--rv': 1, duration: 0.4, ease: 'power1.out' }, 0.6);
    return tl;
  }

  /* ------------------------------------------------------------------ intro */
  function intro(skip) {
    const done = () => { if (lenis) lenis.start(); root.classList.add('intro-done'); };
    if (reduced) { done(); return; }
    if (lenis && !skip) lenis.stop();

    const logoPaths = flightOn ? '.brand path' : '.hero__logo path';
    const it = gsap.timeline({ onComplete: done, defaults: { ease: 'power2.out' } });
    it.from(logoPaths, { yPercent: 106, duration: 1.15, stagger: 0.11, ease: 'power3.out' }, 0.1)
      .from('.portrait img', { autoAlpha: 0, scale: 0.9, filter: 'blur(20px)', duration: 1.2 }, 0.5)
      .from('.hero__h span', { autoAlpha: 0, scale: 0.9, filter: 'blur(10px)', duration: 1, stagger: 0.1 }, 0.8)
      .from('.hcard--a .hcard__bg, ' + (flightOn ? '[data-fly="s1n"], [data-fly="s1l"]' : '.hcard--a [data-ghost]'), { autoAlpha: 0, filter: 'blur(8px)', duration: 0.9 }, 1.05)
      .from('.hcard--b .hcard__bg, ' + (flightOn ? '[data-fly="s2n"], [data-fly="s2l"]' : '.hcard--b [data-ghost]'), { autoAlpha: 0, filter: 'blur(8px)', duration: 0.9 }, 1.15)
      .from('.hcard--c', { autoAlpha: 0, filter: 'blur(8px)', duration: 0.9 }, 1.25)
      .from(flightOn ? '.side__cta, .hero__btn2' : '.hero__btns .btn', { autoAlpha: 0, filter: 'blur(10px)', duration: 0.8, stagger: 0.06 }, 1.2);
    if (flightOn) {
      it.from('.mi__t > span', { yPercent: 115, duration: 0.7, stagger: 0.04 }, 0.9)
        .from('.hero__navg i', { scaleY: 0, duration: 0.5, stagger: 0.04 }, 1.0)
        .from('[data-hl] .ln__i', { yPercent: 105, autoAlpha: 0, duration: 0.7, stagger: 0.075 }, 1.25);
    } else {
      it.from('.mbar', { yPercent: -140, duration: 0.8, ease: 'power3.out' }, 0.2);
    }
    it.set('.hero__h span, .hero__btns .btn, .side__cta, [data-fly^="s"]', { clearProps: 'filter' });
    if (skip) it.progress(1);
  }

  /* ------------------------------------------------------------------ reveals */
  function initReveals() {
    if (reduced) return;
    $$('[data-in]').forEach((el) => {
      gsap.fromTo(el, { autoAlpha: 0, y: 26, filter: 'blur(10px)' }, {
        autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out', clearProps: 'filter,transform',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    $$('[data-lines]').forEach((el) => {
      gsap.set(el, { autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => {
          const sp = splitLines(el);
          gsap.set(el, { autoAlpha: 1 });
          gsap.from(sp.inner, { yPercent: 105, autoAlpha: 0, filter: 'blur(6px)', duration: 0.75, stagger: 0.075, ease: 'power2.out', onComplete: sp.revert });
        }
      });
    });

    $$('[data-fill]').forEach((el) => {
      const chars = splitChars(el);
      gsap.fromTo(chars, { opacity: 0.16 }, {
        opacity: 1, ease: 'none', stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 52%', scrub: 0.6 }
      });
    });

    $$('[data-chars]').forEach((el) => {
      const chars = splitChars(el);
      gsap.fromTo(chars, { opacity: 0.1, y: 5 }, {
        opacity: 1, y: 0, ease: 'power1.out', duration: 0.5, stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 28%', scrub: 0.8 }
      });
    });

    const fl = $('[data-footlogo]');
    if (fl) gsap.from($$('path', fl), { yPercent: 106, duration: 1.2, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: fl, start: 'top 92%', once: true } });
  }

  /* ------------------------------------------------------------------ journey */
  function initJourney() {
    $$('time[data-ago]').forEach((t) => { t.textContent = ago(t.dataset.ago); });

    $$('.jc__btn[aria-expanded]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.jc'); const open = card.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open); btn.textContent = open ? 'Back' : 'Read more';
      });
    });

    // rolling digits
    $$('[data-roll]').forEach((el) => {
      const text = el.textContent.trim(); el.setAttribute('aria-label', text); el.textContent = '';
      [...text].forEach((ch) => {
        const dg = document.createElement('span'); dg.className = 'dg'; dg.setAttribute('aria-hidden', 'true');
        if (/\d/.test(ch)) {
          const col = document.createElement('span'); const d = +ch;
          for (let i = 5; i >= 0; i--) { const n = document.createElement('i'); n.textContent = (d - i + 20) % 10; col.appendChild(n); }
          dg.appendChild(col);
        } else { const n = document.createElement('i'); n.textContent = ch; dg.appendChild(n); }
        el.appendChild(dg);
      });
    });

    $$('.jc').forEach((card) => {
      const cols = $$('.dg > span', card);
      if (reduced) { gsap.set(cols, { yPercent: -100 * 5 / 6 }); return; }
      const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 86%', once: true } });
      tl.from($('.jc__in', card), { autoAlpha: 0, y: 44, scale: 0.95, filter: 'blur(10px)', duration: 1, ease: 'power2.out', clearProps: 'filter,transform' }, 0);
      if (cols.length) tl.fromTo(cols, { yPercent: 0 }, { yPercent: -100 * 5 / 6, duration: 1.3, stagger: 0.09, ease: 'power3.out' }, 0.15);
    });

    if (!desktop.matches) return;

    // curve through one anchor per card
    const route = $('.route'); const svg = $('.route__svg'); const path = $('.route__path'); const tail = $('.route__tail');
    const cards = $$('.jc', route);
    const dots = cards.map(() => { const d = document.createElement('span'); d.className = 'route__dot'; route.appendChild(d); return d; });
    let marks = []; let total = 0;

    // one continuous line that flows downward through the cards: it leaves and reaches
    // every anchor vertically, so each bend is a soft S and nothing loops or doubles back
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    track.setAttribute('class', 'route__track');
    svg.insertBefore(track, path);

    function build() {
      const r = rem(); const gap = 1.6 * r;
      const pts = cards.map((c) => ({
        x: c.dataset.side === 'l' ? c.offsetLeft - gap : c.offsetLeft + c.offsetWidth + gap,
        y: c.offsetTop + c.offsetHeight * 0.5
      }));
      svg.setAttribute('viewBox', '0 0 ' + route.offsetWidth + ' ' + route.offsetHeight);
      const f = (n) => n.toFixed(1);
      const first = pts[0];
      let d = 'M' + f(first.x) + ' ' + f(first.y - 12 * r) + ' L' + f(first.x) + ' ' + f(first.y);
      const prefixes = [d];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i]; const p1 = pts[i + 1]; const pull = (p1.y - p0.y) * 0.5;
        d += ' C' + f(p0.x) + ' ' + f(p0.y + pull) + ' ' + f(p1.x) + ' ' + f(p1.y - pull) + ' ' + f(p1.x) + ' ' + f(p1.y);
        prefixes.push(d);
      }
      path.setAttribute('d', d);
      const last = pts[pts.length - 1];
      const tailD = 'M' + f(last.x) + ' ' + f(last.y) + ' L' + f(last.x) + ' ' + f(last.y + 10 * r);
      tail.setAttribute('d', tailD);
      track.setAttribute('d', d + ' L' + f(last.x) + ' ' + f(last.y + 10 * r));
      total = path.getTotalLength();
      const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      marks = prefixes.map((q) => { probe.setAttribute('d', q); return probe.getTotalLength() / total; });
      pts.forEach((q, i) => { dots[i].style.left = q.x + 'px'; dots[i].style.top = q.y + 'px'; });
      path.style.strokeDasharray = total;
    }
    build();
    ScrollTrigger.addEventListener('refreshInit', build);

    const show = (p) => {
      path.style.strokeDashoffset = total * (1 - p);
      marks.forEach((mk, i) => dots[i].classList.toggle('is-on', p >= mk - 0.002));
      tail.classList.toggle('is-on', p > 0.995);
    };
    if (reduced) { show(1); return; }
    const o = { p: 0 };
    gsap.to(o, { p: 1, ease: 'none', onUpdate: () => show(o.p), scrollTrigger: { trigger: route, start: 'top 72%', end: 'bottom 78%', scrub: 0.5, onRefresh: () => show(o.p) } });
    show(0);
  }

  /* ------------------------------------------------------------------ work */
  function initWork() {
    const work = $('.work'); const track = $('.work__track'); const cards = $$('.wc');
    if (!desktop.matches) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.15 });
      cards.forEach((c) => io.observe(c));
      return;
    }
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const setH = () => { work.style.height = (window.innerHeight + dist()) + 'px'; };
    setH();
    ScrollTrigger.addEventListener('refreshInit', setH);

    let queued = 0;
    const light = () => {
      const lim = window.innerWidth * 0.97;
      cards.forEach((c) => {
        if (c.classList.contains('is-in')) return;
        if (c.getBoundingClientRect().left - 6 * rem() < lim) {
          c.style.transitionDelay = (queued * 90) + 'ms'; queued++;
          c.classList.add('is-in');
          setTimeout(() => { c.style.transitionDelay = ''; queued = Math.max(0, queued - 1); }, 1300);
        }
      });
    };
    if (reduced) { cards.forEach((c) => c.classList.add('is-in')); }
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: work, start: 'top top', end: () => '+=' + dist(), scrub: 0.6, invalidateOnRefresh: true, onUpdate: light }
    });
    ScrollTrigger.create({ trigger: work, start: 'top 55%', once: true, onEnter: light });
  }

  /* ------------------------------------------------------------------ sidebar state */
  function initSide() {
    if (!desktop.matches) return;
    const work = $('.work');
    const targets = $$('.side .panel, .side__mail').map((el) => ({ el, cy: 0 }));
    const measure = () => targets.forEach((t) => { const r = t.el.getBoundingClientRect(); t.cy = r.top + r.height / 2; });
    const paint = () => {
      const r = work.getBoundingClientRect();
      targets.forEach((t) => t.el.classList.toggle('is-dark', r.top < t.cy && r.bottom > t.cy));
    };
    measure();
    ScrollTrigger.addEventListener('refresh', () => { measure(); paint(); });
    ScrollTrigger.create({ trigger: work, start: 'top bottom', end: 'bottom top', onUpdate: paint, onToggle: paint });

    const items = $$('.mi');
    const setOn = (id) => items.forEach((a) => a.classList.toggle('is-on', a.getAttribute('href') === '#' + id));
    ['top', 'journey', 'work', 'stack', 'security', 'github', 'results'].forEach((id) => {
      const el = document.getElementById(id);
      ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => { if (self.isActive) setOn(id); } });
    });

    if (!flightOn) {
      root.classList.add('noflight');
      const past = (self) => root.classList.toggle('past', self.progress > 0);
      ScrollTrigger.create({ trigger: '.hero', start: 'bottom 60%', end: 'max', onEnter: past, onLeaveBack: past, onRefresh: past });
    }
  }

  /* ------------------------------------------------------------------ GitHub */
  const LANG = { Python: '#3572A5', TypeScript: '#3178C6', JavaScript: '#C9B21D', 'C++': '#F34B7D', C: '#555555', Rust: '#B7410E', 'Jupyter Notebook': '#DA5B0B', Solidity: '#AA6746', Java: '#B07219', PHP: '#4F5D95', HTML: '#E34C26', CSS: '#563D7C', Go: '#00ADD8', Shell: '#89E051' };

  function initGithub() {
    const list = $('.ghp__list'); const st = $('.ghp__st'); const stText = $('span', st); const more = $('.ghp__more'); const tabs = $$('.tab');
    if (!list) return;
    let repos = []; let filter = 'mine'; let expanded = false; let first = true;
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function render() {
      const rank = (r) => { const i = REPO_ORDER.indexOf(r.name); return r.team ? -2 : (i < 0 ? -1 : i); };
      const team = TEAM_REPOS.map((t) => Object.assign({ fork: true, team: true }, t));
      const all = repos.concat(team).filter((r) => !HIDE_REPOS.includes(r.name) && !r.archived)
        .filter((r) => filter === 'all' || (filter === 'mine' ? !r.fork : r.fork))
        .sort((a, b) => (rank(a) - rank(b)) || (new Date(b.pushed_at) - new Date(a.pushed_at)));
      const shown = expanded ? all : all.slice(0, REPO_LIMIT);
      list.setAttribute('aria-busy', 'false');
      if (!all.length) { list.innerHTML = '<li class="ghp__empty">Nothing here yet.</li>'; more.hidden = true; return; }
      list.innerHTML = shown.map((r) => {
        const isNew = !r.team && (Date.now() - new Date(r.created_at)) / 864e5 < NEW_DAYS;
        const badge = r.team ? '<b class="repo__new">team</b>' : (isNew ? '<b class="repo__new">new</b>' : '');
        return '<li class="repo"><a href="' + esc(ghUrl(r.html_url)) + '" target="_blank" rel="noopener">' +
          '<span class="repo__n"><span>' + esc(r.name) + '</span>' + badge + '</span>' +
          '<span class="repo__d">' + esc((r.description && r.description.trim().length > 4 ? r.description : REPO_NOTES[r.name]) || r.description || 'No description yet.') + '</span>' +
          '<span class="repo__l">' + (r.language ? '<i style="--lc:' + (LANG[r.language] || 'rgba(11,12,14,.35)') + '"></i>' + esc(r.language) : '') + '</span>' +
          '<span class="repo__t">' + ago(r.pushed_at) + '</span>' +
          '<span class="repo__go"><svg><use href="#i-arrow"/></svg></span></a></li>';
      }).join('');
      more.hidden = all.length <= REPO_LIMIT;
      more.textContent = expanded ? 'Show fewer' : 'Show all ' + all.length;
      if (!reduced && !first) gsap.fromTo(list.children, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.035, ease: 'power2.out', clearProps: 'transform' });
      first = false;
      safeRefresh();
    }
    function status(live, fetchedAt) {
      const n = repos.filter((r) => !HIDE_REPOS.includes(r.name)).length;
      const lastPush = repos.map((r) => r.pushed_at).sort().pop();
      st.classList.toggle('is-off', !live);
      stText.textContent = live
        ? 'Live from GitHub. ' + n + ' public repositories, last push ' + ago(lastPush) + '.'
        : 'GitHub is unreachable. Showing the copy saved ' + ago(fetchedAt) + '.';
    }

    tabs.forEach((t) => t.addEventListener('click', () => {
      filter = t.dataset.f; expanded = false;
      tabs.forEach((x) => { const on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on); });
      render();
    }));
    more.addEventListener('click', () => { expanded = !expanded; render(); });

    const snap = window.REPO_SNAPSHOT;
    if (snap && snap.repos) { repos = snap.repos; render(); }

    const KEY = 'gh-repos-' + GITHUB_USER;
    const load = async () => {
      try {
        const c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
        if (c && Date.now() - c.t < 6e5) return c.d;
      } catch (e) { /* ignore */ }
      const res = await fetch('https://api.github.com/users/' + GITHUB_USER + '/repos?per_page=100&sort=pushed', { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) throw new Error('GitHub ' + res.status);
      const d = (await res.json()).map((r) => ({ name: r.name, description: r.description, html_url: r.html_url, language: r.language, stargazers_count: r.stargazers_count, fork: r.fork, pushed_at: r.pushed_at, created_at: r.created_at, archived: r.archived }));
      try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d })); } catch (e) { /* ignore */ }
      return d;
    };
    load().then((d) => { repos = d; status(true); render(); })
      .catch(() => { if (repos.length) status(false, snap.fetchedAt); else { stText.textContent = 'GitHub is unreachable right now.'; st.classList.add('is-off'); list.setAttribute('aria-busy', 'false'); } });
  }

  /* ------------------------------------------------------------------ open source
     Pull requests to other people's repositories with at least OSS_MIN_STARS stars.
     Merged ones become cards (most-starred first), open ones are listed as "in review".
     data/oss.js (rebuilt by the deploy workflow every hour) is shown first, then each pull
     request that is not merged yet, and any new one in the public activity feed, is checked
     live, so a merge shows up on the next page load. */
  const OSS_MIN_STARS = 3500;
  let dragSync = null;

  function initOss() {
    const row = $('[data-oss-merged]'); const pend = $('.pend'); const list = $('[data-oss-open]');
    if (!row) return;
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const kfmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n));
    const tidy = (t) => { const s = t.replace(/^\s*[A-Za-z]+(\([^)]*\))?:\s*/, ''); return s.charAt(0).toUpperCase() + s.slice(1); };
    const day = (d) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
    let shown = '';

    function render(items) {
      const key = JSON.stringify(items.map((i) => [i.url, i.state, i.stars, i.approved]));
      if (key === shown) return; shown = key;
      const merged = items.filter((i) => i.state === 'merged').sort((a, b) => b.stars - a.stars);
      const open = items.filter((i) => i.state === 'open').sort((a, b) => b.stars - a.stars);
      row.innerHTML = merged.map((i) => {
        const [owner, name] = i.repo.split('/');
        return '<article class="rc oss"><header><span class="rc__av"><img src="https://github.com/' + ghName(owner) + '.png?size=96" alt="" loading="lazy" width="48" height="48"></span>' +
          '<span class="oss__repo">' + esc(owner) + '/<b>' + esc(name) + '</b></span></header>' +
          '<p class="oss__stars"><svg><use href="#s-star"/></svg><b>' + kfmt(i.stars) + '</b><span>stars</span></p>' +
          '<h3>' + esc(tidy(i.title)) + '</h3>' +
          '<footer><a href="' + esc(ghUrl(i.url)) + '" target="_blank" rel="noopener">Pull request #' + i.number + '</a><span>Merged ' + day(i.date) + '</span></footer></article>';
      }).join('');
      pend.hidden = !open.length;
      list.innerHTML = open.map((i) =>
        '<li class="repo"><a href="' + esc(ghUrl(i.url)) + '" target="_blank" rel="noopener">' +
        '<span class="repo__n"><span>' + esc(i.repo.split('/')[1]) + '</span><small>' + kfmt(i.stars) + ' stars</small></span>' +
        '<span class="repo__d">' + esc(tidy(i.title)) + '</span>' +
        '<span class="pend__st' + (i.approved ? ' is-ok' : '') + '">' + (i.approved ? 'Approved' : 'In review') + '</span>' +
        '<span class="repo__go"><svg><use href="#i-arrow"/></svg></span></a></li>').join('');
      $$('[data-fly="s2n"], [data-ghost="s2n"]').forEach((el) => { el.textContent = String(merged.length); });
      if (dragSync) dragSync();
      safeRefresh();
    }

    const snap = (window.OSS_SNAPSHOT && window.OSS_SNAPSHOT.items) || [];
    render(snap);

    // live check: one call for the activity feed, then one per pull request still waiting
    const KEY = 'gh-oss-live-' + GITHUB_USER;
    const H = { headers: { Accept: 'application/vnd.github+json' } };
    (async () => {
      try {
        const c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
        if (c && Date.now() - c.t < 6e5) return c.d;
      } catch (e) { /* ignore */ }
      const byKey = new Map(snap.map((i) => [i.repo + '#' + i.number, i]));
      try {
        const ev = await fetch('https://api.github.com/users/' + GITHUB_USER + '/events/public?per_page=100', H);
        if (ev.ok) {
          (await ev.json()).filter((e) => e.type === 'PullRequestEvent' && e.payload && e.payload.pull_request).forEach((e) => {
            const k = e.repo.name + '#' + e.payload.pull_request.number;
            if (!byKey.has(k) && e.repo.name.split('/')[0].toLowerCase() !== GITHUB_USER.toLowerCase()) byKey.set(k, { repo: e.repo.name, number: e.payload.pull_request.number, state: 'unknown' });
          });
        }
      } catch (e) { /* feed is optional */ }
      const out = [];
      for (const it of byKey.values()) {
        if (it.state === 'merged') { out.push(it); continue; }
        try {
          const r = await fetch('https://api.github.com/repos/' + it.repo + '/pulls/' + it.number, H);
          if (!r.ok) { if (it.state === 'open') out.push(it); continue; }
          const pr = await r.json();
          if (!pr.user || pr.user.login.toLowerCase() !== GITHUB_USER.toLowerCase()) continue;
          if (!pr.merged_at && pr.state !== 'open') continue;
          const stars = pr.base.repo.stargazers_count;
          if (stars < OSS_MIN_STARS) continue;
          out.push({ repo: it.repo, stars, number: it.number, title: pr.title, url: pr.html_url, state: pr.merged_at ? 'merged' : 'open', date: pr.merged_at || pr.created_at, approved: !pr.merged_at && !!it.approved });
        } catch (e) { if (it.state === 'open') out.push(it); }
      }
      try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: out })); } catch (e) { /* ignore */ }
      return out;
    })().then((d) => { if (d && d.length) render(d); }).catch(() => { /* keep the saved copy */ });
  }

  /* ------------------------------------------------------------------ results drag row */
  function initDrag() {
    const view = $('[data-drag]'); if (!view) return;
    const track = $('.res__track', view); const dash = $('.res__dash');
    let cards = []; let dashes = [];
    let x = 0, tx = 0, down = false, sx = 0, stx = 0, moved = 0, lastX = 0, v = 0, cur = -1;
    dragSync = () => {
      cards = $$('.rc', track); dash.textContent = '';
      cards.forEach(() => dash.appendChild(document.createElement('i')));
      dashes = $$('i', dash); cur = -1; tx = 0;
    };
    dragSync();
    if (!desktop.matches) return;

    const min = () => Math.min(0, view.clientWidth - parseFloat(getComputedStyle(view).paddingLeft) - track.scrollWidth);
    const clamp = (n) => Math.max(min(), Math.min(0, n));
    const step = () => (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 1);

    view.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      down = true; moved = 0; sx = lastX = e.clientX; stx = tx; v = 0; cursor.classList.add('is-down');
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      v = e.clientX - lastX; lastX = e.clientX; tx = clamp(stx + dx * 1.15);
    });
    window.addEventListener('pointerup', () => {
      if (!down) return; down = false; cursor.classList.remove('is-down');
      tx = clamp(Math.round((tx + v * 9) / step()) * step());
    });
    view.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    view.addEventListener('dragstart', (e) => e.preventDefault());
    view.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); tx = clamp(tx - e.deltaX); } }, { passive: false });
    track.addEventListener('focusin', (e) => { const c = e.target.closest('.rc'); if (c) { tx = clamp(-c.offsetLeft); view.scrollLeft = 0; } });
    view.addEventListener('scroll', () => { view.scrollLeft = 0; });

    gsap.ticker.add(() => {
      if (Math.abs(tx - x) < 0.05 && cur !== -1) return;
      x += (tx - x) * (reduced ? 1 : 0.11);
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      const i = Math.max(0, Math.min(cards.length - 1, Math.round(-tx / step())));
      if (i !== cur) { cur = i; dashes.forEach((d, n) => d.classList.toggle('is-on', n === i)); }
    });

    const cursor = $('.dragc');
    if (!canHover || reduced) return;
    const qx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
    const qy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
    gsap.set(cursor, { scale: 0.4 });
    const showC = (on) => gsap.to(cursor, { autoAlpha: on ? 1 : 0, scale: on ? 1 : 0.4, duration: 0.3, ease: on ? 'back.out(1.7)' : 'power2.in', overwrite: 'auto' });
    view.addEventListener('pointerenter', (e) => { gsap.set(cursor, { x: e.clientX, y: e.clientY }); showC(true); });
    view.addEventListener('pointerleave', () => showC(false));
    view.addEventListener('pointermove', (e) => { qx(e.clientX); qy(e.clientY); showC(!e.target.closest('a')); });
  }

  /* ------------------------------------------------------------------ contact chat */
  function initChat() {
    const chat = $('.chat'); if (!chat) return;
    const dots = $('.chat__dots'), b = $('.chat__b'), btn = $('.chat__btn');
    if (reduced) { gsap.set([b, btn], { opacity: 1 }); return; }
    gsap.set([b, btn], { scale: 0 });
    gsap.set(dots, { scale: 0 });
    gsap.timeline({ scrollTrigger: { trigger: chat, start: 'top 86%', once: true } })
      .to(dots, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }, 0.2)
      .to(dots, { opacity: 0, scale: 0.6, duration: 0.2, ease: 'power2.in' }, 1.5)
      .to(b, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.7)' }, 1.65)
      .to(btn, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.7)' }, 2.25);
  }

  /* ------------------------------------------------------------------ UI */
  function initUi() {
    $$('.btn__t').forEach((t) => {
      const text = t.textContent; t.textContent = ''; t.setAttribute('aria-label', text);
      [...text].forEach((ch, i) => { const s = document.createElement('span'); s.className = 'bc'; s.style.setProperty('--i', i); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); t.appendChild(s); });
    });

    $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
    const clock = $('[data-clock]');
    if (clock) {
      const tick = () => { clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Tunis' }).format(new Date()); };
      tick(); setInterval(tick, 30000);
    }

    $$('[data-copy]').forEach((btn) => {
      const tip = $('.side__tip', btn);
      btn.addEventListener('click', async () => {
        let ok = true;
        try { await navigator.clipboard.writeText(btn.dataset.copy); } catch (e) { ok = false; }
        tip.textContent = ok ? 'Copied' : btn.dataset.copy; tip.classList.add('is-on');
        setTimeout(() => tip.classList.remove('is-on'), 1600);
      });
    });

    const mbtn = $('.mbar__btn'), menu = $('.mmenu');
    const setMenu = (open) => {
      menu.hidden = false; menu.classList.toggle('is-open', open);
      mbtn.setAttribute('aria-expanded', open); mbtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    };
    $$('a', menu).forEach((a, i) => a.style.setProperty('--i', i));
    mbtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const target = document.getElementById(a.getAttribute('href').slice(1)); if (!target) return;
      e.preventDefault();
      if (menu.classList.contains('is-open')) setMenu(false);
      scrollToEl(target);
      history.replaceState(null, '', ' ');
    });

    desktop.addEventListener('change', () => location.reload());
  }

  /* ------------------------------------------------------------------ boot */
  async function boot() {
    const hash = location.hash && document.getElementById(location.hash.slice(1));
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const img = $('.portrait img');
    await Promise.race([
      Promise.all([document.fonts ? document.fonts.ready : 0, img && img.decode ? img.decode().catch(() => {}) : 0]),
      new Promise((r) => setTimeout(r, 2500))
    ]);

    $$('[data-hl]').forEach((el) => splitLines(el));
    window.scrollTo(0, 0);          // again after the wait: some browsers restore the old position late
    initLenis();
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    initUi();
    const run = (fn) => { try { fn(); } catch (e) { console.error(e); } };
    if (flightOn) initFlight();      // if this one fails the catch below falls back to the plain page
    [initSide, initReveals, initJourney, initWork, initGithub, initOss, initDrag, initChat].forEach(run);

    root.classList.add('ready');
    intro(!!hash);
    run(() => ScrollTrigger.refresh());
    if (hash) setTimeout(() => scrollToEl(hash, true), 120);
    window.addEventListener('load', safeRefresh);
    window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
  }

  boot().catch((err) => {
    console.error(err);
    root.classList.remove('js', 'flight');
    root.classList.add('ready');
  });
})();
