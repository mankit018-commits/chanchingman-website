function setLang(lang, btn){
    var isZh = lang === 'zh';
    document.body.classList.toggle('zh', isZh);
    document.documentElement.lang = isZh ? 'zh-Hant' : 'en';
    document.querySelectorAll('.lang-btn').forEach(function(b){
        var active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
}

function toggleDetail(card){
    var detail = card.querySelector('.practice-detail');
    var open = detail.classList.toggle('active');
    card.setAttribute('aria-expanded', open ? 'true' : 'false');
}

var _legalLastFocus = null;
function showLegalTab(name){
    ['terms','privacy'].forEach(function(n){
        var tab = document.getElementById('tab-' + n);
        var panel = document.getElementById('panel-' + n);
        var active = n === name;
        if (tab) { tab.classList.toggle('active', active); tab.setAttribute('aria-selected', active ? 'true' : 'false'); }
        if (panel) panel.classList.toggle('active', active);
    });
    // Scroll body back to top when switching tabs
    var body = document.querySelector('.legal-modal-body');
    if (body) body.scrollTop = 0;
}
function openLegal(name){
    var modal = document.getElementById('legalModal');
    if (!modal) return;
    _legalLastFocus = document.activeElement;
    showLegalTab(name || 'terms');
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    var activeTab = document.getElementById('tab-' + (name || 'terms'));
    if (activeTab) activeTab.focus();
}
function closeLegal(){
    var modal = document.getElementById('legalModal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
    if (_legalLastFocus && _legalLastFocus.focus) _legalLastFocus.focus();
}

(function(){
    // Mobile nav toggle
    var navToggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function(){
            var open = navLinks.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        // Close the menu after a link is tapped
        navLinks.querySelectorAll('a').forEach(function(link){
            link.addEventListener('click', function(){
                navLinks.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Make every clickable card keyboard-accessible
    document.querySelectorAll('[onclick]').forEach(function(el){
        if (el.tagName === 'BUTTON' || el.tagName === 'A') return;
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
        if (!el.hasAttribute('aria-expanded')) el.setAttribute('aria-expanded', 'false');
        el.addEventListener('keydown', function(e){
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                el.click();
            }
        });
    });

    // Keep aria-expanded in sync for cards that toggle their own .active class
    document.querySelectorAll('.team-card, .media-card, .blog-card').forEach(function(card){
        card.addEventListener('click', function(){
            card.setAttribute('aria-expanded', card.classList.contains('active') ? 'true' : 'false');
        });
    });

    // Legal modal: close on backdrop click and Esc key
    var legalModal = document.getElementById('legalModal');
    if (legalModal) {
        legalModal.addEventListener('click', function(e){
            if (e.target === legalModal) closeLegal();
        });
    }
    document.addEventListener('keydown', function(e){
        if (e.key === 'Escape' && legalModal && legalModal.classList.contains('open')) {
            closeLegal();
        }
    });
})();

/* ===== Added features: FAQ, scroll-spy, fade-in, scroll-top, PWA ===== */
(function(){
    // FAQ accordion
    document.querySelectorAll('.faq-q').forEach(function(btn){
        btn.addEventListener('click', function(){
            var item = btn.closest('.faq-item');
            var open = item.classList.toggle('open');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    });

    // Scroll fade-in animations
    var sections = Array.prototype.slice.call(document.querySelectorAll('section')).filter(function(s){
        return s.id !== 'home';
    });
    if ('IntersectionObserver' in window) {
        sections.forEach(function(s){ s.classList.add('reveal'); });
        var io = new IntersectionObserver(function(entries){
            entries.forEach(function(entry){
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        sections.forEach(function(s){ io.observe(s); });
    }

    // Scroll-spy: highlight current nav link
    var navLinkEls = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
    var spyTargets = navLinkEls.map(function(a){
        var id = a.getAttribute('href').slice(1);
        var sec = document.getElementById(id);
        return sec ? { link: a, sec: sec } : null;
    }).filter(Boolean);

    // Scroll-to-top button
    var scrollTopBtn = document.getElementById('scrollTop');
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', function(){
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    var ticking = false;
    function onScroll(){
        var y = window.pageYOffset || document.documentElement.scrollTop;

        // scroll-top visibility
        if (scrollTopBtn) scrollTopBtn.classList.toggle('show', y > 400);

        // scroll-spy
        var current = null;
        var probe = y + 120; // account for fixed nav height
        spyTargets.forEach(function(t){
            if (t.sec.offsetTop <= probe) current = t;
        });
        navLinkEls.forEach(function(a){ a.classList.remove('active'); });
        if (current) current.link.classList.add('active');

        ticking = false;
    }
    window.addEventListener('scroll', function(){
        if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
    });
    onScroll();
})();

// PWA: register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function(){
        navigator.serviceWorker.register('sw.js').catch(function(err){
            console.warn('Service worker registration failed:', err);
        });
    });
}
