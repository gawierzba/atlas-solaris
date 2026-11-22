/* ATLAS SOLARIS — wspólna stopka i nawigacja po długich artykułach.
   Lekki, samodzielny moduł; bez bibliotek i animacji działających stale. */
(function () {
  'use strict';
  if (window.__atlasReaderUI) return;
  window.__atlasReaderUI = true;

  var script = document.currentScript;
  var base = new URL('../', script && script.src ? script.src : document.baseURI);
  function link(path) { return new URL(path, base).href; }

  function init() {
    if (!document.body) return;
    var body = document.body;
    var route = Number(body.getAttribute('data-route') || 0);
    var kind = body.getAttribute('data-kind') || '';
    // Laboratoria 13–27 oraz moduły dodatkowe korzystają z całego ekranu.
    // Nie zasłaniamy elementów symulacji stopką ani przyciskiem.
    var fullscreen = kind === 'bonus' ||
      (route >= 13 && route <= 27 && !document.querySelector('article'));
    if (fullscreen) return;

    if (!document.getElementById('atlasReaderUIStyles')) {
      var styles = document.createElement('style');
      styles.id = 'atlasReaderUIStyles';
      styles.textContent = [
        '#atlasReaderFooter{box-sizing:border-box;clear:both;position:relative;z-index:2;width:100%;margin:0;padding:0;background:#07121f;color:#d9e9f5;border-top:1px solid #294052;font-family:Inter,"Segoe UI",Arial,sans-serif;text-align:left;letter-spacing:normal;box-shadow:0 -25px 80px #030b1438}',
        '#atlasReaderFooter *{box-sizing:border-box}',
        '#atlasReaderFooter .as-inner{max-width:1500px;margin:auto;padding:52px max(24px,5.3vw) 40px;display:grid;grid-template-columns:minmax(0,1.7fr) minmax(145px,1fr) minmax(145px,1fr);gap:36px}',
        '#atlasReaderFooter .as-brand{display:inline-flex;align-items:center;gap:12px;color:#eaf6ff;text-decoration:none;font-size:16px;font-weight:750;letter-spacing:.15em;line-height:1.3}',
        '#atlasReaderFooter .as-brand span{display:grid;place-items:center;width:37px;height:37px;flex:none;border:1px solid #4f8ca0;border-radius:50%;color:#94e6f1;font-size:23px;font-weight:400;background:radial-gradient(circle,#1f485b,#0e1d30)}',
        '#atlasReaderFooter .as-brand em{font-style:normal;color:#8cdde8}',
        '#atlasReaderFooter .as-intro{max-width:380px;margin:16px 0 0;font-size:13px;font-weight:400;color:#91a8bd;line-height:1.85}',
        '#atlasReaderFooter .as-links{display:flex;flex-direction:column;align-items:flex-start;gap:11px;min-width:0}',
        '#atlasReaderFooter .as-links strong{font-size:10px;letter-spacing:.17em;color:#a9cbdc;margin:0 0 8px;font-weight:800}',
        '#atlasReaderFooter a{transition:color .2s ease}',
        '#atlasReaderFooter .as-links a{font-size:13px;font-weight:500;color:#9bb2c6;text-decoration:none;line-height:1.45}',
        '#atlasReaderFooter a:hover{color:#e3f9ff}',
        '#atlasReaderFooter a:focus-visible,#atlasBackToTop:focus-visible{outline:2px solid #95eff6;outline-offset:4px}',
        '#atlasReaderFooter .as-bottom{max-width:1500px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px max(24px,5.3vw) 25px;border-top:1px solid #1e3445;color:#7390a8;font-size:10px;font-weight:500;letter-spacing:.1em;line-height:1.5}',
        '#atlasBackToTop{position:fixed;z-index:1100;right:clamp(14px,2.5vw,30px);bottom:calc(18px + env(safe-area-inset-bottom,0px));width:46px;height:46px;display:flex;align-items:center;justify-content:center;padding:0;border:1px solid #587f9a;border-radius:13px;background:rgba(8,25,44,.93);color:#c7f3ff;box-shadow:0 8px 28px #0007,inset 0 1px 0 #bfeeff22;cursor:pointer;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(9px);transition:opacity .23s ease,transform .23s ease,background .23s ease,visibility .23s}',
        '#atlasBackToTop.as-visible{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0)}',
        '#atlasBackToTop:hover{background:#163750;border-color:#8bdce9}',
        '#atlasBackToTop svg{display:block;width:20px;height:20px;stroke:currentColor;stroke-width:1.9;fill:none;stroke-linecap:round;stroke-linejoin:round}',
        '@media(max-width:700px){#atlasReaderFooter .as-inner{grid-template-columns:1fr 1fr;gap:28px 18px;padding:40px 22px 32px}#atlasReaderFooter .as-about{grid-column:1/-1}#atlasReaderFooter .as-bottom{padding:18px 22px 25px;flex-direction:column;align-items:flex-start;gap:5px}#atlasBackToTop{width:44px;height:44px;border-radius:12px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px))}}',
        '@media(max-width:370px){#atlasReaderFooter .as-inner{grid-template-columns:1fr}#atlasReaderFooter .as-about{grid-column:auto}}',
        '@media(prefers-reduced-motion:reduce){#atlasBackToTop{transition:none}#atlasReaderFooter a{transition:none}}'
      ].join('\n');
      document.head.appendChild(styles);
    }

    // Portal główny i działy mają już własną rozbudowaną stopkę.
    if (!document.querySelector('.site-footer') && !document.getElementById('atlasReaderFooter')) {
      var footer = document.createElement('footer');
      footer.id = 'atlasReaderFooter';
      footer.setAttribute('aria-label', 'Stopka serwisu ATLAS SOLARIS');
      footer.innerHTML = [
        '<div class="as-inner">',
          '<div class="as-about"><a class="as-brand" href="' + link('') + '"><span aria-hidden="true">✧</span><b>ATLAS <em>SOLARIS</em></b></a>',
          '<p class="as-intro">Interaktywny atlas astronomiczny. Piękno kosmosu spotyka tu opowieści, naukę i eksperymenty, które możesz odkrywać we własnym tempie.</p></div>',
          '<nav class="as-links" aria-label="Odkrywanie atlasu"><strong>ODKRYWAJ</strong>',
          '<a href="' + link('#etapy') + '">Wszystkie etapy</a>',
          '<a href="' + link('etapy/01/') + '">Układ Słoneczny</a>',
          '<a href="' + link('etapy/17/') + '">Zjawiska i zaćmienia</a>',
          '<a href="' + link('etapy/33/') + '">Magnetar</a>',
          '<a href="' + link('etapy/34/') + '">Supernowe</a>',
          '<a href="' + link('etapy/35/') + '">Narodziny gwiazd</a>',
          '<a href="' + link('etapy/36/') + '">Narodziny planet</a>',
          '<a href="' + link('etapy/14/') + '">Archiwum misji</a>',
          '<a href="' + link('etapy/15/') + '">Łowca Egzoplanet</a>',
          '<a href="' + link('etapy/16/') + '">Asteroidy i komety</a>',
          '<a href="' + link('etapy/17/') + '">Laboratorium Zaćmień</a>',
          '<a href="' + link('etapy/18/') + '">Żywe Obserwatorium</a></nav>',
          '<nav class="as-links" aria-label="Informacje o Atlasie"><strong>O PROJEKCIE</strong>',
          '<a href="' + link('o-projekcie/') + '">Idea i metodologia</a>',
          '<a href="' + link('etapy/27/') + '">Historia Atlasu</a>',
          '<a href="' + link('') + '">Strona główna</a></nav>',
        '</div>',
        '<div class="as-bottom"><span>© ATLAS SOLARIS · INTERAKTYWNY ATLAS ASTRONOMICZNY</span><span>NAUKA · ODKRYWANIE · WYOBRAŹNIA</span></div>'
      ].join('');
      body.appendChild(footer);
    }

    if (document.getElementById('atlasBackToTop')) return;
    var up = document.createElement('button');
    up.id = 'atlasBackToTop';
    up.type = 'button';
    up.setAttribute('aria-label', 'Wróć na górę strony');
    up.setAttribute('title', 'Wróć na górę');
    up.setAttribute('tabindex', '-1');
    up.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>';
    body.appendChild(up);

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    var scheduled = false;
    function update() {
      scheduled = false;
      var top = Math.max(window.pageYOffset || 0, document.documentElement.scrollTop || 0, body.scrollTop || 0);
      var fullHeight = Math.max(document.documentElement.scrollHeight, body.scrollHeight);
      var visible = top > Math.min(650, Math.max(300, window.innerHeight * .75)) &&
        fullHeight > window.innerHeight + 450;
      up.classList.toggle('as-visible', visible);
      up.setAttribute('tabindex', visible ? '0' : '-1');
    }
    function requestUpdate() {
      if (scheduled) return;
      scheduled = true;
      if (window.requestAnimationFrame) window.requestAnimationFrame(update);
      else update();
    }
    up.addEventListener('click', function () {
      try { window.scrollTo({top: 0, behavior: reduced && reduced.matches ? 'auto' : 'smooth'}); }
      catch (_) { window.scrollTo(0, 0); }
    });
    window.addEventListener('scroll', requestUpdate, {passive: true});
    window.addEventListener('resize', requestUpdate);
    window.addEventListener('pageshow', requestUpdate);
    requestUpdate();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();
