/* Colleges: the university finder on the home page, and the filter on list pages. Searched inside the browser. */
(function () {
  'use strict';
  var d = document, $ = function (id) { return d.getElementById(id); }, esc = function (s) { return SYG.esc(s); };

  /* ---------- filter a table or grid by words and by kind ---------- */
  var f = $('cl-f'), t = $('cl-t');
  if (f && t) {
    var none = $('cl-none'), kind = '';
    var apply = function () {
      var words = f.value.trim().toLowerCase().split(/\s+/).filter(Boolean), n = 0;
      [].forEach.call(t.querySelectorAll('[data-f]'), function (r) {
        var k = r.getAttribute('data-f'), hit = words.every(function (w) { return k.indexOf(w) > -1; }) && (!kind || r.getAttribute('data-k') === kind);
        r.hidden = !hit; if (hit) n++;
      });
      if (none) none.hidden = n > 0;
    };
    f.addEventListener('input', apply);
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-kind]'); if (!b) return;
      kind = b.getAttribute('data-kind');
      [].forEach.call(d.querySelectorAll('[data-kind]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      apply();
    });
  }

  /* ---------- the finder ---------- */
  var q = $('cl-q'); if (!q) return;
  var out = $('cl-out'), D = null, wait = null;
  function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function card(u) {
    var text = u[0] + ' (' + D.states[u[1]] + ') is on the UGC list of universities as on ' + D.asof + '.';
    return '<div class="result rise"><h2>On the UGC list</h2><p class="cl-name">' + esc(u[0]) + '</p><dl class="facts"><dt>Kind</dt><dd>' + esc(D.kinds[u[2]]) + '</dd><dt>State or UT</dt><dd>' + esc(D.states[u[1]]) + '</dd>' +
      (u[3] ? '<dt>Town</dt><dd>' + esc(u[3]) + '</dd>' : '') + '<dt>UGC status</dt><dd>' + esc(u[4] || 'Not stated') + '</dd>' +
      (u[5] ? '<dt>Website</dt><dd><a href="' + esc(u[5]) + '" rel="noopener nofollow">' + esc(u[5].replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')) + '</a></dd>' : '') + '</dl>' +
      '<div class="acts"><a class="btn sm" href="/states/' + SYG.slug(D.states[u[1]]) + '/">Universities in ' + esc(D.states[u[1]]) + '</a><button class="btn sm ghost" type="button" data-copy="' + esc(text) + '">Copy</button>' +
      '<button class="btn sm ghost" type="button" data-wa="' + esc(text + ' colleges.shareyourgroup.com') + '">WhatsApp</button></div>' +
      '<p class="hint">As listed on ugc.gov.in on ' + esc(D.asof) + '. Confirm on the UGC website before you pay a fee.</p></div>';
  }
  function run() {
    var v = norm(q.value);
    if (v.length < 3) { out.innerHTML = v ? '<p class="hint">Type at least three letters.</p>' : ''; return; }
    var words = v.split(' ');
    var hits = D.u.filter(function (u) { var n = norm(u[0] + ' ' + u[3] + ' ' + D.states[u[1]]); return words.every(function (w) { return n.indexOf(w) > -1; }); });
    hits.sort(function (a, b) { return (norm(a[0]).indexOf(v) === 0 ? 0 : 1) - (norm(b[0]).indexOf(v) === 0 ? 0 : 1); });
    var fake = D.fake.filter(function (x) { var n = norm(x[0]); return words.every(function (w) { return n.indexOf(w) > -1; }); });
    var warn = fake.length ? '<div class="result cl-warn"><h2>Warning: on the UGC list of fake universities</h2>' + fake.slice(0, 5).map(function (x) { return '<p><b>' + esc(x[0]) + '</b> (' + esc(x[1]) + ')</p>'; }).join('') +
      '<p>The UGC says such institutions cannot award degrees. <a href="/fake-universities/">See the full list</a>.</p></div>' : '';
    if (!hits.length && warn) { out.innerHTML = warn; return; }
    if (!hits.length) {
      out.innerHTML = '<div class="result cl-warn"><h2>Not found on the UGC list</h2><p>No university on the UGC list matches "' + esc(q.value.trim()) + '". Check the spelling and try a shorter part of the name.</p>' +
        '<p>If it is a <b>college</b>, search for the university it is affiliated to. If it calls itself a <b>university</b> and is not on the list, look at the <a href="/fake-universities/">UGC list of fake universities</a> and read <a href="/check-a-college/">how to check a college</a> before paying anything.</p></div>';
      return;
    }
    if (hits.length === 1) { out.innerHTML = warn + card(hits[0]); return; }
    out.innerHTML = warn + '<p class="hint">' + hits.length + ' matches' + (hits.length > 40 ? ', showing the first 40. Add a word to narrow it down' : '') + '. Tap one.</p><ul class="cl-list">' + hits.slice(0, 40).map(function (u) {
      return '<li><button type="button" data-pick="' + D.u.indexOf(u) + '"><b>' + esc(u[0]) + '</b><small>' + esc(D.kinds[u[2]]) + ' · ' + esc((u[3] ? u[3] + ', ' : '') + D.states[u[1]]) + '</small></button></li>';
    }).join('') + '</ul>';
  }
  function go() {
    if (D) return run();
    if (!wait) { out.innerHTML = '<div class="shim"></div>'; wait = SYG.json('/data/universities.json').then(function (j) { D = j; }); }
    wait.then(run, function () { out.innerHTML = '<p class="hint">The list could not be loaded. Check your connection and try again.</p>'; wait = null; });
  }
  q.addEventListener('input', go);
  d.addEventListener('click', function (e) { var b = e.target.closest('[data-pick]'); if (!b || !D) return; out.innerHTML = card(D.u[parseInt(b.getAttribute('data-pick'), 10)]); out.scrollIntoView({ block: 'nearest' }); });
  var p = new URLSearchParams(location.search).get('q'); if (p) { q.value = p; go(); }
})();
