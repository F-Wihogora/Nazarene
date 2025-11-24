async function loadPartial(targetId, partialPath) {
  try {
    const res = await fetch(partialPath);
    if (!res.ok) return;
    const html = await res.text();
    const target = document.getElementById(targetId);
    if (target) target.innerHTML = html;
  } catch {}
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadPartial('zzz-header', '../partials/header-zzz.html');
  await loadPartial('zzz-footer', '../partials/footer-zzz.html');

  // Inject mobile frame styles once
  if (!document.getElementById('mobile-frame-style')) {
    const style = document.createElement('style');
    style.id = 'mobile-frame-style';
    style.textContent = `
      :root { --mobile-max: 420px; --mobile-min: 320px; }
      body { background-color: inherit; }
      .mobile-frame {
        margin-left: auto; margin-right: auto;
        max-width: var(--mobile-max); min-width: var(--mobile-min);
        min-height: 100dvh;
        background-color: inherit;
      }
      header, footer, nav {
        padding-top: max(env(safe-area-inset-top), 0px);
        padding-bottom: max(env(safe-area-inset-bottom), 0px);
      }
    `;
    document.head.appendChild(style);
  }

  // Apply mobile frame to the first top-level container
  const firstContainer = document.body.children[0];
  if (firstContainer && !firstContainer.classList.contains('mobile-frame')) {
    firstContainer.classList.add('mobile-frame');
  }

  // Theme toggle (persist in localStorage)
  const themeKey = 'zzz-theme';
  function applyTheme(t) {
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem(themeKey, t);
    const icon = document.querySelector('#zzz-theme-toggle .material-symbols-outlined');
    if (icon) icon.textContent = t === 'dark' ? 'light_mode' : 'dark_mode';
  }
  const savedTheme = localStorage.getItem(themeKey) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);
  const themeBtn = document.getElementById('zzz-theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', () => applyTheme(localStorage.getItem(themeKey) === 'dark' ? 'light' : 'dark'));

  // i18n (EN/Kinyarwanda) basic implementation
  const langKey = 'zzz-lang';
  const i18n = {
    en: {
      'nav.home': 'Home',
      'nav.about': 'About',
      'nav.ministries': 'Ministries',
      'nav.events': 'Events',
      'nav.sermons': 'Sermons',
      'nav.donate': 'Donate',
      'nav.contact': 'Contact',
      'nav.blog': 'Blog',
      'auth.login': 'Login',
      'auth.register': 'Register'
    },
    rw: {
      'nav.home': 'Ahabanza',
      'nav.about': 'Ibyacu',
      'nav.ministries': 'Amatorero',
      'nav.events': 'Ibikorwa',
      'nav.sermons': 'Inyigisho',
      'nav.donate': 'Tanga',
      'nav.contact': 'Tuvugishe',
      'nav.blog': 'Blogi',
      'auth.login': 'Injira',
      'auth.register': 'Iyandikishe'
    }
  };
  function t(key) {
    const lang = localStorage.getItem(langKey) || 'en';
    return (i18n[lang] && i18n[lang][key]) || i18n.en[key] || key;
  }
  function applyLang() {
    const lang = localStorage.getItem(langKey) || 'en';
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'BUTTON') {
        if (el.hasAttribute('placeholder')) el.setAttribute('placeholder', val);
        else el.textContent = val;
      } else {
        el.textContent = val;
      }
    });
    const btn = document.getElementById('zzz-lang-toggle');
    if (btn) btn.textContent = lang.toUpperCase();
  }
  if (!localStorage.getItem(langKey)) localStorage.setItem(langKey, 'en');
  applyLang();
  const langBtn = document.getElementById('zzz-lang-toggle');
  if (langBtn) langBtn.addEventListener('click', () => {
    const next = (localStorage.getItem(langKey) || 'en') === 'en' ? 'rw' : 'en';
    localStorage.setItem(langKey, next);
    applyLang();
  });

  const menuBtn = document.getElementById('zzz-mobile-menu-btn');
  const nav = document.querySelector('header nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      nav.classList.toggle('hidden');
      nav.classList.toggle('flex');
      nav.classList.toggle('flex-col');
      nav.classList.toggle('absolute');
      nav.classList.toggle('top-16');
      nav.classList.toggle('left-0');
      nav.classList.toggle('right-0');
      nav.classList.toggle('bg-white');
      nav.classList.toggle('dark:bg-stone-800');
      nav.classList.toggle('p-4');
      nav.classList.toggle('shadow-lg');
    });
  }

  // Back button handler
  function goBack() {
    try {
      if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
        history.back();
        return;
      }
    } catch {}
    window.location.href = '../index.html';
  }

  const backBtn = document.getElementById('zzz-back-btn');
  if (backBtn) backBtn.addEventListener('click', goBack);

  // Delegate: any element with data-back, or a button/link containing an arrow_back icon
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;
    const backEl = target.closest('[data-back], .js-back, a[href="#back"], button[data-action="back"]');
    const iconButton = target.closest('button, a');
    const icon = iconButton?.querySelector('.material-symbols-outlined');
    const isArrowIcon = icon && icon.textContent && icon.textContent.trim().startsWith('arrow_back');
    if (backEl || isArrowIcon) {
      e.preventDefault();
      goBack();
    }
  });
});


