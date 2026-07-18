const topbar = document.querySelector('.topbar');
const toggle = document.querySelector('[data-mobile-toggle]');
const year = document.querySelector('[data-year]');

if (year) year.textContent = new Date().getFullYear();

if (toggle && topbar) {
  toggle.addEventListener('click', () => {
    const open = topbar.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  topbar.querySelectorAll('.nav-links a, .nav-actions a').forEach((link) => {
    link.addEventListener('click', () => {
      topbar.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

document.querySelectorAll('[data-track]').forEach((item) => {
  item.addEventListener('click', () => {
    const eventName = item.getAttribute('data-track');
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName });
  });
});

document.querySelectorAll('[data-lead-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = data.get('name') || '';
    const phone = data.get('phone') || '';
    const society = data.get('society') || '';
    const scope = data.get('scope') || '';
    const budget = data.get('budget') || '';
    const possession = data.get('possession') || '';
    const message = [
      'Hi Spacious Venture, I want a free initial quote.',
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Society: ${society}`,
      `Possession: ${possession}`,
      `Scope: ${scope}`,
      `Budget: ${budget}`
    ].join('\n');
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'quote_form_submit', society, scope, budget });
    window.location.href = `https://wa.me/919538536950?text=${encodeURIComponent(message)}`;
  });
});
