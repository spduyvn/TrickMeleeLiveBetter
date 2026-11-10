const button = document.querySelector('.menu-toggle');
button?.addEventListener('click', () => {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  document.querySelector('#primary-nav')?.classList.toggle('is-open', !expanded);
});
