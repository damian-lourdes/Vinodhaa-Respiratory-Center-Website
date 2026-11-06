  // theme toggle: one round button. It shows a moon in light mode and a sun in dark mode; a tap switches.
  var themeToggle = document.getElementById('themeToggle');
  (function () {
    var isDark = function () { return document.documentElement.getAttribute('data-theme') === 'dark'; };
    function label() { themeToggle.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode'); }
    label();
    themeToggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      label();
    });
  })();

  // header nav: a thin underline rests under the current page's link, glides to whichever link is hovered
  // or focused, and returns when the pointer leaves the nav
  (function () {
    var nav = document.querySelector('header.site nav.links');
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll(':scope > a, :scope > .nav-drop > a'));
    if (!links.length) return;
    var bar = document.createElement('span');
    bar.className = 'nav-underline';
    bar.setAttribute('aria-hidden', 'true');
    nav.appendChild(bar);
    var current = links.filter(function (a) { return a.getAttribute('aria-current') === 'page'; })[0] || null;
    // pages inside the Specialty menu rest under "Specialty"
    if (!current && nav.querySelector('.drop-item[aria-current="page"]')) current = nav.querySelector('.nav-drop > a');

    function place(a) {
      if (!a || !a.offsetParent) { bar.style.opacity = '0'; return; }
      var n = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
      var icon = a.querySelector('.icon');                    // keep the line under the words, not the chevron
      var w = (icon ? icon.getBoundingClientRect().left - 4 : r.right) - r.left;
      bar.style.transform = 'translateX(' + (r.left - n.left).toFixed(1) + 'px) scaleX(' + Math.max(w, 1).toFixed(1) + ')';
      bar.style.opacity = '1';
    }
    var rest = function () { place(current); };

    links.forEach(function (a) {
      a.addEventListener('mouseenter', function () { place(a); });
      a.addEventListener('focus', function () { place(a); });
    });
    nav.addEventListener('mouseleave', rest);
    nav.addEventListener('focusout', function (e) { if (!nav.contains(e.relatedTarget)) rest(); });
    window.addEventListener('resize', rest);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rest);

    rest();
    // place it first without animating, then let it glide
    requestAnimationFrame(function () { requestAnimationFrame(function () { bar.classList.add('is-ready'); }); });
  })();

  // blog: live search and topic filters over the article cards. Builds its own toolbar so the page is a plain
  // list without JS. Matches the title, summary and topic; matched words are highlighted.
  (function () {
    var grid = document.querySelector('.post-grid');
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.post-card'));
    if (cards.length < 2) return;
    var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); };
    var posts = cards.map(function (c) {
      var h = c.querySelector('h3'), p = c.querySelector('h3 + p'), cat = c.querySelector('.cat');
      return { el: c, h: h, p: p, title: h.textContent, sum: p ? p.textContent : '', topic: cat ? cat.textContent.trim() : '' };
    });
    var topics = [];
    posts.forEach(function (x) { if (x.topic && topics.indexOf(x.topic) < 0) topics.push(x.topic); });

    var bar = document.createElement('div');
    bar.className = 'blog-tools';
    bar.innerHTML =
      '<label class="blog-search"><svg class="icon" width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
      '<span class="sr-only">Search articles</span><input type="search" placeholder="Search articles" autocomplete="off" spellcheck="false" />' +
      '<button type="button" class="blog-clear" aria-label="Clear search" hidden><svg class="icon" width="14" height="14"><use href="#i-x"/></svg></button></label>' +
      '<div class="blog-topics" role="group" aria-label="Filter by topic"></div>' +
      '<p class="blog-count sr-only" aria-live="polite"></p>';
    grid.parentNode.insertBefore(bar, grid);
    var empty = document.createElement('div');
    empty.className = 'blog-empty'; empty.hidden = true;
    empty.innerHTML = '<p class="t">No articles match that.</p><p>Try another word, or <button type="button" class="blog-reset">show all articles</button>.</p>';
    grid.parentNode.insertBefore(empty, grid.nextSibling);

    var input = bar.querySelector('input'), clearBtn = bar.querySelector('.blog-clear'), count = bar.querySelector('.blog-count');
    var topicWrap = bar.querySelector('.blog-topics'), active = 'All';
    ['All'].concat(topics).forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'blog-topic'; b.dataset.topic = t;
      b.innerHTML = esc(t);
      b.addEventListener('click', function () { active = t; update(); });
      topicWrap.appendChild(b);
    });

    // one dark highlight that slides to the selected topic
    var pill = document.createElement('span');
    pill.className = 'blog-topic-pill'; pill.setAttribute('aria-hidden', 'true');
    topicWrap.insertBefore(pill, topicWrap.firstChild);
    function movePill() {
      var on = topicWrap.querySelector('.blog-topic[aria-pressed="true"]');
      if (!on) return;
      pill.style.width = on.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + on.offsetLeft + 'px)';
    }
    window.addEventListener('resize', movePill);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);

    function mark(text, words) {
      if (!words.length) return esc(text);
      var re = new RegExp('(' + words.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'gi');
      return text.split(re).map(function (part, i) { return i % 2 ? '<mark>' + esc(part) + '</mark>' : esc(part); }).join('');
    }
    function update() {
      var q = input.value.trim().toLowerCase(), words = q ? q.split(/\s+/) : [], shown = 0;
      posts.forEach(function (x) {
        var hay = (x.title + ' ' + x.sum + ' ' + x.topic).toLowerCase();
        var hit = (active === 'All' || x.topic === active) && words.every(function (w) { return hay.indexOf(w) >= 0; });
        x.el.hidden = !hit;
        if (hit) { shown++; x.el.classList.add('is-visible'); }
        x.h.innerHTML = mark(x.title, words);
        if (x.p) x.p.innerHTML = mark(x.sum, words);
      });
      topicWrap.querySelectorAll('.blog-topic').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.topic === active ? 'true' : 'false'); });
      movePill();
      clearBtn.hidden = !input.value;
      empty.hidden = shown > 0;
      count.textContent = shown === posts.length ? posts.length + ' articles' : shown + ' of ' + posts.length + ' articles';
    }
    input.addEventListener('input', update);
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; update(); } });
    clearBtn.addEventListener('click', function () { input.value = ''; update(); input.focus(); });
    empty.querySelector('.blog-reset').addEventListener('click', function () { input.value = ''; active = 'All'; update(); input.focus(); });
    update();
    // place the highlight first without animating, then let it slide
    requestAnimationFrame(function () { requestAnimationFrame(function () { topicWrap.classList.add('is-ready'); }); });
  })();

  // pharmacy "How to order": draw the line between the steps once they scroll into view
  (function () {
    var steps = document.querySelector('.order-steps');
    if (!steps) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return; // already drawn
    steps.classList.add('os-anim');
    void steps.offsetWidth; // apply the waiting state now
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      // wait until the waiting state has been painted, or a section already on screen at load would not animate
      requestAnimationFrame(function () { requestAnimationFrame(function () { steps.classList.add('is-drawn'); }); });
    }, { threshold: 0.45 });
    io.observe(steps);
  })();

  // titles: fold each letter in (styles in css/styles.css). After React Bits' FoldText. Page titles at the top play on load,
  // after the splash if there is one (home carousel titles play each time their slide arrives); section titles play as they scroll into view. Only the title's own text is split,
  // so a line inside it like the home page's "30 years" stays as it is. Screen readers get the plain words.
  (function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    var esc = function (c) { return c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
    function split(h) {
      var i = 0;
      Array.prototype.slice.call(h.childNodes).forEach(function (node) {
        if (node.nodeType !== 3 || !node.nodeValue.trim()) return;
        var text = node.nodeValue.replace(/\s+/g, ' ').trim();
        var words = text.split(' ').map(function (w) {
          return '<span class="ft-word">' + Array.from(w).map(function (c) {
            return '<span class="ft-seg"><span class="ft-piece" style="--i:' + (i++) + '" data-t="' + esc(c) + '">' + esc(c) + '</span></span>';
          }).join('') + '</span>';
        });
        var wrap = document.createElement('span');
        wrap.innerHTML = '<span class="sr-only">' + esc(text) + '</span><span aria-hidden="true">' + words.join(' ') + '</span>';
        h.replaceChild(wrap, node);
      });
      if (!i) return 0;
      h.style.setProperty('--ft-s', Math.min(45, Math.round(1000 / i)) + 'ms'); // long titles still finish in about a second
      h.classList.remove('reveal'); h.classList.add('fold-text');
      return i;
    }
    function unfold(h, delay) {
      var n = h.querySelectorAll('.ft-piece').length;
      setTimeout(function () {
        requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('is-unfolded'); }); });
        setTimeout(function () { h.classList.add('is-done'); }, 700 + n * 45);
      }, delay);
    }
    // page titles: once the splash has gone (it clears by about 1s)
    var splash = !document.documentElement.classList.contains('no-splash') && document.querySelector('.splash');
    if (splash) { // hold the home carousel's title folded until the splash has gone
      document.documentElement.classList.add('ft-wait');
      setTimeout(function () { document.documentElement.classList.remove('ft-wait'); }, 950);
    }
    Array.prototype.forEach.call(document.querySelectorAll('.hero h1, .hero .hc-title, .page-hero h1'), function (h) {
      if (split(h) && !h.closest('.hc-slide')) unfold(h, splash ? 950 : 80); // home carousel titles play with their slide (CSS)
    });
    // home page: the fixed lungs behind the page fade to about half strength as you scroll past the hero (styles in css/styles.css)
  (function () {
    var hero = document.querySelector('.hero-carousel'), back = hero && hero.querySelector('.hc-backdrop');
    if (!back) return;
    var ticking = false;
    function update() {
      ticking = false;
      var f = Math.min(Math.max(window.scrollY / (hero.offsetHeight * 0.8), 0), 1);
      back.style.setProperty('--lb-fade', f.toFixed(3));
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  })();

  // section titles: as they scroll into view
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); unfold(e.target, 0); } });
    }, { rootMargin: '0px 0px -18% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('h2.section-title, .cta-band h2, .reach-grid h2'), function (h) {
      if (!h.children.length && split(h)) io.observe(h);
    });
  })();

  // FAQ chat widget
  (function () {
    var widget = document.getElementById('faqWidget');
    var tab = document.getElementById('faqTab');
    var closeBtn = document.getElementById('faqClose');
    var chatBody = document.getElementById('chatBody');
    if (!widget || !tab || !chatBody) return;

    var ANSWERS = {
      location: 'We have two clinics. <strong>Chennai:</strong> F 185, Shanshelter, F Block, 9th Street, near Vetri IAS Academy, Anna Nagar East (<a href="https://www.google.com/maps/dir//13.08812,80.22224" target="_blank" rel="noreferrer">directions</a>). <strong>Kanchipuram:</strong> 1, Hospital Road, (Bus stand back side), Kanchipuram - 631 502 (<a href="https://www.google.com/maps/dir/?api=1&destination=1%2C+Hospital+Road%2C+Kanchipuram+631502" target="_blank" rel="noreferrer">directions</a>).',
      hours: '<strong>Chennai:</strong> Mon, Wed &ndash; Sat, 6:30 PM &ndash; 9:30 PM. <strong>Kanchipuram:</strong> Tuesday, 9:00 AM &ndash; 6:00 PM. Closed on Sundays.',
      fees: 'Fees vary by visit type. Call us for current consultation charges &mdash; Chennai <a href="tel:+919841032627">98410 32627</a>, Kanchipuram <a href="tel:+919442745036">94427 45036</a>.',
      conditions: 'Asthma, COPD, interstitial lung disease, pneumonia, tuberculosis and pulmonary cancer &mdash; <a href="respiratory-treatment.html">see respiratory care</a>. We also run a sleep lab with CPAP, BiPAP and oxygen concentrators &mdash; <a href="sleep-lab.html">see the sleep lab</a>.',
      sleep: 'Yes &mdash; sleep studies and diagnostics happen on site, so results and follow-up stay with Dr. Dhanasekar.',
      pharmacy: 'Yes &mdash; we have an in-clinic pharmacy. Order on <a href="https://wa.me/919841032627?text=Hi%2C%20I%27d%20like%20to%20order%20medicines%20from%20the%20Vinodhaa%20Respiratory%20Centre%20pharmacy.%20Sharing%20my%20prescription%20below." target="_blank" rel="noreferrer">WhatsApp</a> or call <a href="tel:+919841032627">98410 32627</a> and we&rsquo;ll deliver through Swiggy, Porter or Rapido.',
      products: 'Yes &mdash; we sell CPAP and BiPAP machines and oxygen concentrators at 5&ndash;10% below market price, with setup and follow-up at the clinic. <a href="products.html">See products</a>, or <a href="https://wa.me/919841032627?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20buying%20CPAP%20%2F%20BiPAP%20%2F%20oxygen%20concentrator%20equipment%20from%20Vinodhaa%20Respiratory%20Centre." target="_blank" rel="noreferrer">enquire on WhatsApp</a>.',
      book: 'Call Chennai <a href="tel:+919841032627">98410 32627</a> or Kanchipuram <a href="tel:+919442745036">94427 45036</a>, message us on <a href="https://wa.me/919841032627?text=Hi%2C%20I%27d%20like%20to%20book%20an%20appointment%20at%20Vinodhaa%20Respiratory%20Centre." target="_blank" rel="noreferrer">WhatsApp</a>, or use the Book Appointment button on this page.'
    };

    function scrollToBottom() {
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    function addMessage(text, from) {
      var msg = document.createElement('div');
      msg.className = 'chat-msg ' + from;
      msg.innerHTML = text;
      chatBody.appendChild(msg);
      scrollToBottom();
    }

    widget.querySelectorAll('.chat-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-q');
        if (!ANSWERS[key]) return;
        addMessage(chip.textContent, 'user');
        window.setTimeout(function () {
          addMessage(ANSWERS[key], 'bot');
        }, 300);
      });
    });

    tab.addEventListener('click', function () {
      var open = widget.classList.toggle('open');
      tab.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) scrollToBottom();
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        widget.classList.remove('open');
        tab.setAttribute('aria-expanded', 'false');
      });
    }
    document.addEventListener('click', function (e) {
      if (widget.classList.contains('open') && !widget.contains(e.target)) {
        widget.classList.remove('open');
        tab.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && widget.classList.contains('open')) {
        widget.classList.remove('open');
        tab.setAttribute('aria-expanded', 'false');
      }
    });
  })();

  // hero carousel: auto-advances every few seconds, pauses on hover/focus or
  // when the tab is hidden, and supports arrows, dots, swipe and arrow keys.
  // Off-screen slides are made inert so their links can't be tabbed to.
  (function () {
    var root = document.querySelector('.hero-carousel');
    var track = document.getElementById('hcTrack');
    var dotsWrap = document.getElementById('hcDots');
    if (!root || !track || !dotsWrap) return;

    var slides = Array.prototype.slice.call(track.children);

    // split each slide headline into masked words so it can rise in word by
    // word; nested elements (e.g. the "30 years" line) move as one unit
    slides.forEach(function (slide) {
      var heading = slide.querySelector('h1, h2');
      if (!heading) return;
      var n = 0;
      Array.prototype.slice.call(heading.childNodes).forEach(function (node) {
        var frag = document.createDocumentFragment();
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var outer = document.createElement('span');
            outer.className = 'w';
            var inner = document.createElement('span');
            inner.style.setProperty('--i', n++);
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
        } else if (node.nodeType === 1) {
          var block = document.createElement('span');
          block.className = 'w w-block';
          var wrap = document.createElement('span');
          wrap.style.setProperty('--i', n++);
          node.parentNode.insertBefore(block, node);
          wrap.appendChild(node);
          block.appendChild(wrap);
          return;
        } else {
          return;
        }
        heading.replaceChild(frag, node);
      });
    });
    var count = slides.length;
    var INTERVAL = 3000;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var index = 0;
    var timer = null;
    var paused = false;
    var movingTimer = null;

    var dots = slides.map(function (slide, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'hc-dot';
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(dot);
      return dot;
    });

    // seamless loop: a copy of the first slide sits after the last one.
    // Going forward from the last slide animates onto the copy, then snaps
    // (without animation) back to the real first slide; going back from the
    // first slide does the reverse.
    var clone = slides[0].cloneNode(true);
    clone.classList.add('hc-clone');
    clone.removeAttribute('aria-label');
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    track.appendChild(clone);
    var pos = 0; // track position, 0..count (count = the clone)

    function setPos(p, animate) {
      pos = p;
      if (!animate) track.style.transition = 'none';
      track.style.transform = 'translate3d(' + (-p * 100) + '%, 0, 0)';
      if (!animate) {
        track.offsetHeight; // apply the jump before restoring the transition
        track.style.transition = '';
      }
    }

    // once a slide has settled: if we landed on the clone, snap to the real
    // first slide, then update which slides are inert. Nothing on the page is
    // touched while the track is moving, so the compositor can run the slide
    // without any repaint or layer rebuild mid-transition.
    function settle() {
      window.clearTimeout(movingTimer);
      if (pos === count) setPos(0, false);
      track.querySelectorAll('.is-leaving').forEach(function (el) { el.classList.remove('is-leaving'); });
      slides.forEach(function (slide, k) {
        var active = k === index;
        if (slide.inert === active) {
          slide.inert = !active;
          slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        }
      });
    }
    track.addEventListener('transitionend', function (e) {
      if (e.target === track) settle();
    });

    function go(i) {
      if (pos === count) settle(); // finish a pending wrap before moving again
      var next = (i + count) % count;
      if (next === index) return;
      var animate = !reduceMotion;
      var target = next;
      if (i >= count) {
        target = count; // forward past the last slide: move onto the clone
      } else if (i < 0) {
        setPos(count, false); // back past the first slide: start from the clone
      }
      // direction drives the parallax: artwork travels further than the text
      var dir = (i >= count || (i >= 0 && next > index)) ? 1 : -1;
      root.style.setProperty('--hc-dir', dir);
      var leaving = pos === count ? clone : slides[index];
      leaving.classList.add('is-leaving');
      if (leaving === slides[0]) clone.classList.add('is-leaving');
      if (leaving === clone) slides[0].classList.add('is-leaving');
      index = next;
      updateDots();
      activate(next);
      runProgress();
      setPos(target, animate);
      if (animate) {
        // fallback in case transitionend doesn't fire (e.g. tab in background)
        window.clearTimeout(movingTimer);
        movingTimer = window.setTimeout(settle, 1000);
      } else {
        settle();
      }
    }

    function updateDots() {
      dots.forEach(function (dot, k) {
        dot.setAttribute('aria-current', k === index ? 'true' : 'false');
      });
    }
    // entrance animation: the arriving slide gets .is-active, which fades and
    // lifts its text in line by line and scales its artwork up (CSS). The clone
    // mirrors slide 1 so the loop snap is invisible.
    function activate(i) {
      slides.forEach(function (slide, k) { slide.classList.toggle('is-active', k === i); });
      clone.classList.toggle('is-active', i === 0);
    }

    // the active dot fills like a progress bar over the autoplay interval
    function runProgress() {
      dots.forEach(function (dot) { dot.classList.remove('run'); });
      if (!timer) return;
      void dots[index].offsetWidth; // restart the CSS animation
      dots[index].classList.add('run');
    }

    function stop() {
      window.clearInterval(timer);
      timer = null;
      root.classList.add('is-paused');
    }
    function start() {
      stop();
      if (reduceMotion || paused || document.hidden) return;
      root.classList.remove('is-paused');
      timer = window.setInterval(function () { go(index + 1); }, INTERVAL);
      runProgress();
    }
    function restart() { start(); }

    document.getElementById('hcPrev').addEventListener('click', function () { go(index - 1); restart(); });
    document.getElementById('hcNext').addEventListener('click', function () { go(index + 1); restart(); });

    root.addEventListener('mouseenter', function () { paused = true; stop(); });
    root.addEventListener('mouseleave', function () { paused = false; start(); });
    root.addEventListener('focusin', function () { paused = true; stop(); });
    root.addEventListener('focusout', function (e) {
      if (!root.contains(e.relatedTarget)) { paused = false; start(); }
    });
    document.addEventListener('visibilitychange', start);
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(index - 1); }
      else if (e.key === 'ArrowRight') { go(index + 1); }
    });

    // swipe on touch screens; swallow the click that follows a swipe so a
    // swipe across a linked slide doesn't navigate away
    var startX = null, startY = null, swiped = false;
    root.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      startX = e.clientX; startY = e.clientY; swiped = false;
    });
    root.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      startX = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        swiped = true;
        go(index + (dx < 0 ? 1 : -1));
        restart();
      }
    });
    root.addEventListener('click', function (e) {
      if (swiped) { e.preventDefault(); swiped = false; }
    }, true);

    updateDots();
    settle();
    if (!reduceMotion) {
      root.style.setProperty('--hc-interval', INTERVAL + 'ms');
      root.classList.add('hc-anim');
      // let the first paint happen hidden, then play slide 1's entrance
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { activate(index); });
      });
    } else {
      activate(0);
    }
    start();
  })();

  // marquee: clone the item set as many times as needed so the track always
  // covers at least (ticker width + one set width) — otherwise, on wide
  // screens, a single duplicate set can run out before the loop point,
  // leaving a visible blank gap. Also pins the loop distance to the exact
  // measured pixel width of one set, immune to font-swap/rounding drift.
  (function () {
    var ticker = document.querySelector('.ticker');
    var track = document.getElementById('marqueeTrack');
    var template = document.getElementById('marqueeSet');
    if (!ticker || !track || !template) return;

    function ensureCoverage() {
      Array.prototype.slice.call(track.querySelectorAll('.track-set:not(#marqueeSet)'))
        .forEach(function (el) { track.removeChild(el); });

      var setStyle = getComputedStyle(template);
      var setWidth = template.getBoundingClientRect().width + parseFloat(setStyle.marginRight || 0);
      if (!setWidth) return;

      var viewportWidth = ticker.getBoundingClientRect().width;
      var needed = viewportWidth + setWidth + 100;
      var totalWidth = setWidth;
      while (totalWidth < needed) {
        var clone = template.cloneNode(true);
        clone.removeAttribute('id');
        track.appendChild(clone);
        totalWidth += setWidth;
      }
      track.style.setProperty('--marquee-distance', '-' + setWidth + 'px');
    }

    ensureCoverage();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(ensureCoverage);
    }
    window.addEventListener('load', ensureCoverage);
    window.addEventListener('resize', ensureCoverage);
  })();

  // mobile menu
  var menuBtn = document.getElementById('menuBtn');
  var mobilePanel = document.getElementById('mobilePanel');
  var menuIconUse = document.getElementById('menuIconUse');
  menuBtn.addEventListener('click', function () {
    var open = mobilePanel.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuIconUse.setAttribute('href', open ? '#i-x' : '#i-list');
  });
  mobilePanel.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      mobilePanel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
      menuIconUse.setAttribute('href', '#i-list');
    });
  });

  // booking modal
  var overlay = document.getElementById('bookingOverlay');
  function openBooking() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeBooking() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('[data-open-booking]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      mobilePanel.classList.remove('open');
      openBooking();
    });
  });
  document.querySelectorAll('[data-close-booking]').forEach(function (el) {
    el.addEventListener('click', closeBooking);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeBooking();
  });

  // booking form: no backend on a static site, so we route the request into
  // a prefilled WhatsApp message to the clinic with the details filled in
  var bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('bfName').value.trim();
      var phone = document.getElementById('bfPhone').value.trim();
      var reason = document.getElementById('bfReason').value;
      var dateVal = document.getElementById('bfDate').value;
      var timeSelect = document.getElementById('bfTime');
      var timeLabel = timeSelect.options[timeSelect.selectedIndex] ? timeSelect.options[timeSelect.selectedIndex].text : '';
      var dateLabel = document.getElementById('bfDateText').textContent;
      var clinic = dateVal ? clinicFor(new Date(dateVal + 'T00:00:00')).name : '';
      var message = 'Hi, I\'d like to request an appointment at Vinodhaa Respiratory Centre.\n' +
        'Clinic: ' + clinic + '\n' +
        'Name: ' + name + '\n' +
        'Phone: ' + phone + '\n' +
        'Reason for visit: ' + reason + '\n' +
        'Preferred date: ' + (dateVal ? dateLabel : '') + '\n' +
        'Preferred time: ' + timeLabel;
      window.open('https://wa.me/919841032627?text=' + encodeURIComponent(message), '_blank', 'noopener');
      bookingForm.reset();
      resetCalendar();
      closeBooking();
    });
  }

  // which clinic the doctor is at on a given day: Kanchipuram on Tuesdays,
  // Chennai on Mon and Wed - Sat. Slots run every 30 min until 30 min before close.
  var CLINICS = {
    chennai: { name: 'Chennai (Anna Nagar East)', open: [18, 30], close: [21, 30] },
    kanchipuram: { name: 'Kanchipuram (Hospital Road)', open: [9, 0], close: [18, 0] }
  };
  function clinicFor(date) {
    return date.getDay() === 2 ? CLINICS.kanchipuram : CLINICS.chennai;
  }
  function timeSlots(clinic) {
    var slots = [];
    var mins = clinic.open[0] * 60 + clinic.open[1];
    var last = clinic.close[0] * 60 + clinic.close[1] - 30;
    for (; mins <= last; mins += 30) {
      var h = Math.floor(mins / 60), m = mins % 60;
      var label = ((h + 11) % 12 + 1) + ':' + String(m).padStart(2, '0') + (h < 12 ? ' AM' : ' PM');
      slots.push({ value: String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'), label: label });
    }
    return slots;
  }
  function updateTimeOptions(date) {
    var select = document.getElementById('bfTime');
    var clinicNote = document.getElementById('bfClinic');
    select.innerHTML = '';
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = date ? 'Choose a time' : 'Pick a date first';
    select.appendChild(placeholder);
    select.disabled = !date;
    clinicNote.hidden = !date;
    if (!date) return;
    var clinic = clinicFor(date);
    timeSlots(clinic).forEach(function (slot) {
      var opt = document.createElement('option');
      opt.value = slot.value;
      opt.textContent = slot.label;
      select.appendChild(opt);
    });
    clinicNote.textContent = 'Appointment at the ' + clinic.name + ' clinic';
  }

  // mini calendar for the preferred-date field, restricted to the doctor's
  // consulting days (Mon - Sat across both clinics)
  var resetCalendar = function () {};
  (function () {
    var field = document.getElementById('dateField');
    var toggle = document.getElementById('bfDateToggle');
    var textEl = document.getElementById('bfDateText');
    var hiddenInput = document.getElementById('bfDate');
    var pop = document.getElementById('calPop');
    var monthLabel = document.getElementById('calMonth');
    var grid = document.getElementById('calGrid');
    var prevBtn = document.getElementById('calPrev');
    var nextBtn = document.getElementById('calNext');
    if (!field || !toggle || !grid) return;

    var MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var WEEKDAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var CLOSED_DAYS = [0]; // Sunday
    var MAX_MONTHS_AHEAD = 2;

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var viewYear = today.getFullYear();
    var viewMonth = today.getMonth();
    var selected = null;

    function isSameDay(a, b) {
      return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    function pad(n) { return String(n).padStart(2, '0'); }

    function render() {
      monthLabel.textContent = MONTH_NAMES[viewMonth] + ' ' + viewYear;
      grid.innerHTML = '';

      var firstOfMonth = new Date(viewYear, viewMonth, 1);
      var startOffset = firstOfMonth.getDay();
      var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

      for (var i = 0; i < startOffset; i++) {
        var blank = document.createElement('span');
        blank.className = 'cal-day blank';
        grid.appendChild(blank);
      }

      for (var d = 1; d <= daysInMonth; d++) {
        var dayDate = new Date(viewYear, viewMonth, d);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cal-day';
        btn.textContent = d;

        var isPast = dayDate < today;
        var isClosed = CLOSED_DAYS.indexOf(dayDate.getDay()) !== -1;
        if (isPast || isClosed) {
          btn.disabled = true;
        }
        if (isSameDay(dayDate, today)) btn.classList.add('today');
        if (selected && isSameDay(dayDate, selected)) btn.classList.add('selected');

        (function (chosenDate) {
          btn.addEventListener('click', function () {
            selected = chosenDate;
            hiddenInput.value = chosenDate.getFullYear() + '-' + pad(chosenDate.getMonth() + 1) + '-' + pad(chosenDate.getDate());
            textEl.textContent = WEEKDAY_SHORT[chosenDate.getDay()] + ', ' + chosenDate.getDate() + ' ' + MONTH_NAMES[chosenDate.getMonth()].slice(0, 3);
            toggle.classList.remove('placeholder');
            updateTimeOptions(chosenDate);
            closeCal();
            render();
          });
        })(dayDate);

        grid.appendChild(btn);
      }

      var atCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
      prevBtn.disabled = atCurrentMonth;
      var monthsAhead = (viewYear - today.getFullYear()) * 12 + (viewMonth - today.getMonth());
      nextBtn.disabled = monthsAhead >= MAX_MONTHS_AHEAD;
    }

    function openCal() {
      field.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    }
    function closeCal() {
      field.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      if (field.classList.contains('open')) { closeCal(); } else { openCal(); }
    });
    prevBtn.addEventListener('click', function () {
      viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      render();
    });
    nextBtn.addEventListener('click', function () {
      viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      render();
    });
    document.addEventListener('click', function (e) {
      if (field.classList.contains('open') && !field.contains(e.target)) closeCal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && field.classList.contains('open')) closeCal();
    });

    resetCalendar = function () {
      selected = null;
      viewYear = today.getFullYear();
      viewMonth = today.getMonth();
      textEl.textContent = 'Choose a date';
      toggle.classList.add('placeholder');
      updateTimeOptions(null);
      render();
    };

    render();
  })();

  // scroll reveal
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  }

  // nav shadow on scroll (IntersectionObserver-based, no scroll listener)
  var header = document.getElementById('siteHeader');
  var sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
  document.getElementById('top').prepend(sentinel);
  new IntersectionObserver(function (entries) {
    header.classList.toggle('scrolled', !entries[0].isIntersecting);
  }).observe(sentinel);

  // animated count-up numbers
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function formatNumber(n, format) {
    n = Math.round(n);
    return format === 'comma' ? n.toLocaleString('en-IN') : String(n);
  }
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var format = el.getAttribute('data-format') || '';
    if (reduceMotion) {
      el.textContent = prefix + formatNumber(target, format) + suffix;
      return;
    }
    var started = false;
    var obs = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || started) return;
      started = true;
      var start = performance.now();
      var duration = 1400;
      function tick(now) {
        var t = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = prefix + formatNumber(target * eased, format) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.disconnect();
    }, { threshold: 0.6 });
    obs.observe(el);
  });

  // products hero: 3D depth carousel. Ported from the DepthCarousel component in React Bits
  // (reactbits.dev) to plain JS; GSAP's power3.out tween is replaced by the same curve on requestAnimationFrame.
  (function () {
    var root = document.getElementById('productDepth');
    if (!root) return;
    var stage = root.querySelector('.dc-stage');
    var products = Array.prototype.slice.call(stage.querySelectorAll('.dc-card'));
    var P = products.length;
    if (!P) return;
    var cfg = { cardWidth: 340, depth: 180, spread: 55, tilt: 22, dir: 1, visibleCards: 4, falloff: 0.16, blur: 4, duration: 700, autoplayDelay: 3200 };
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // repeat the set so the stack has depth even with three products; dots still count the products
    var cards = products.slice();
    while (cards.length < 6 && P > 1) {
      products.forEach(function (c) {
        var copy = c.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        stage.appendChild(copy);
        cards.push(copy);
      });
    }
    var n = cards.length;
    var tints = cards.map(function (c) { return c.querySelector('.dc-tint'); });
    var pos = 0, focus = 0, scale = 1, anim = null, drag = null, wheelTimer = null;

    var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };
    var wrap = function (i) { return ((i % n) + n) % n; };

    function layout(p) {
      for (var i = 0; i < n; i++) {
        var d = i - p;
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
        var back = Math.max(0, d), shown = Math.abs(d) <= cfg.visibleCards + 0.5;
        var opacity = shown ? (d < 0 ? Math.max(0, 1 + d) : 1) : 0;
        var brightness = Math.max(0.15, 1 - back * cfg.falloff);
        var blurPx = Math.min(cfg.blur, (back / Math.max(1, cfg.visibleCards)) * cfg.blur);
        var el = cards[i];
        el.style.transform = 'translate(-50%, -50%) scale(' + scale + ') translateX(' + (cfg.dir * cfg.spread * d).toFixed(2) + 'px) translateZ(' +
          (-cfg.depth * d).toFixed(2) + 'px) rotateY(' + (cfg.dir * cfg.tilt * clamp(d, 0, 1)).toFixed(3) + 'deg)';
        el.style.opacity = opacity.toFixed(3);
        el.style.filter = 'brightness(' + brightness.toFixed(3) + ') blur(' + blurPx.toFixed(2) + 'px)';
        el.style.zIndex = String(Math.round(2000 - d * 20));
        el.style.pointerEvents = shown && opacity > 0.05 ? 'auto' : 'none';
        tints[i].style.opacity = clamp(back * cfg.falloff * 1.25, 0, 0.86).toFixed(3);
      }
    }

    function tweenTo(target) {
      if (anim) cancelAnimationFrame(anim);
      var from = pos, t0 = performance.now(), dur = reduced ? 0 : cfg.duration;
      (function step(now) {
        var t = dur ? Math.min((now - t0) / dur, 1) : 1;
        pos = from + (target - from) * (1 - Math.pow(1 - t, 3)); // power3.out
        layout(pos);
        if (t < 1) anim = requestAnimationFrame(step);
        else { anim = null; pos = wrap(pos); layout(pos); }
      })(t0);
    }

    // dots for the real products
    var dotsWrap = root.querySelector('.dc-dots'), dots = [];
    for (var k = 0; k < P; k++) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'dc-dot'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Show ' + products[k].querySelector('.pc-cap').textContent);
      b.addEventListener('click', (function (idx) { return function () { setFocus(focus - (focus % P) + idx); }; })(k));
      dotsWrap.appendChild(b); dots.push(b);
    }
    function markActive() {
      dots.forEach(function (d, i) { var on = i === focus % P; d.classList.toggle('is-active', on); d.setAttribute('aria-selected', on ? 'true' : 'false'); });
      cards.forEach(function (c, i) { if (i < P) c.setAttribute('aria-hidden', i === focus % P ? 'false' : 'true'); });
    }

    function setFocus(raw) {
      var idx = wrap(raw), delta = idx - pos;
      delta = ((delta % n) + n) % n;
      if (delta > n / 2) delta -= n;
      tweenTo(pos + delta);
      focus = idx;
      markActive();
    }
    var go = function (step) { setFocus(focus + step); };

    root.querySelector('.dc-prev').addEventListener('click', function () { go(-1); });
    root.querySelector('.dc-next').addEventListener('click', function () { go(1); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });
    cards.forEach(function (c, i) { c.addEventListener('click', function () { if (!(drag && drag.moved)) setFocus(i); }); });

    // drag with momentum
    var stepPx = function () { return Math.max(cfg.cardWidth * 0.55 * scale, 40); };
    root.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.dc-arrow, .dc-dot')) return;
      if (anim) cancelAnimationFrame(anim);
      drag = { x: e.clientX, start: pos, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false, id: e.pointerId };
    });
    root.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; root.setPointerCapture(drag.id); }
      if (!drag.moved) return;
      var now = performance.now();
      drag.v = (e.clientX - drag.lastX) / Math.max(now - drag.lastT, 1);
      drag.lastX = e.clientX; drag.lastT = now;
      pos = drag.start - dx / stepPx();
      layout(pos);
    });
    function endDrag() {
      if (!drag) return;
      var d = drag;
      setTimeout(function () { drag = null; }, 0); // let the click handler see the drag first
      if (d.moved) setFocus(Math.round(pos - (d.v * 180) / stepPx()));
    }
    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);

    // sideways trackpad swipes move the cards; vertical scrolling is left to the page
    root.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (anim) cancelAnimationFrame(anim);
      pos += clamp((e.deltaMode === 1 ? e.deltaX * 24 : e.deltaX) / (cfg.cardWidth * 0.9), -0.6, 0.6);
      layout(pos);
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(function () { setFocus(Math.round(pos)); }, 130);
    }, { passive: false });

    // shrink the stack to fit narrow screens
    new ResizeObserver(function (entries) {
      scale = clamp(entries[0].contentRect.width / (cfg.cardWidth + cfg.spread * 2 + 20), 0.4, 1);
      layout(pos);
    }).observe(root);

    // autoplay, paused while hovered or focused
    if (!reduced) {
      var hovered = false, focused = false;
      root.addEventListener('mouseenter', function () { hovered = true; });
      root.addEventListener('mouseleave', function () { hovered = false; });
      root.addEventListener('focusin', function () { focused = true; });
      root.addEventListener('focusout', function () { focused = false; });
      setInterval(function () { if (!hovered && !focused && !drag && !held && !document.hidden) go(1); }, cfg.autoplayDelay);
    }

    markActive();
    layout(0);

    // product cards below: pointing at one turns the carousel to that machine and holds it there
    var held = false;
    Array.prototype.forEach.call(document.querySelectorAll('.product-card'), function (card, idx) {
      if (idx >= P) return;
      card.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        held = true;
        if (focus % P !== idx) setFocus(focus - (focus % P) + idx);
      });
      card.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') held = false; });
    });
  })();

  document.getElementById('copyrightYear').textContent = '© ' + new Date().getFullYear() + ' Vinodhaa Respiratory Centre.';

  // remember internal page-to-page clicks so the next page skips the load splash
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var href = a.getAttribute('href');
    if (!/^(#|tel:|mailto:|https?:|\/\/)/.test(href) && /\.html(#|$)/.test(href)) {
      try { sessionStorage.setItem('internalNav', String(Date.now())); } catch (err) {}
    }
  }, true);
