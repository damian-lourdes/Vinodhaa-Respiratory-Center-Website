  // theme toggle
  var themeToggle = document.getElementById('themeToggle');
  function setToggleState() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
  }
  setToggleState();
  themeToggle.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    setToggleState();
  });

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
