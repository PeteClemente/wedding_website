(function () {
  // SHA-256 hash of the site password, so it's not sitting in plain text here.
  // To change the password: hash the new one and replace this value.
  const PASSWORD_HASH = '1166fc36c96ac1116e8e7806d8036979aa59778c4db224ddef0d3f7422fff6e5';

  const form = document.getElementById('password-form');
  const input = document.getElementById('site-password');
  const statusEl = document.getElementById('password-status');
  if (!form) return;

  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    const hash = await sha256Hex(input.value.trim());

    if (hash === PASSWORD_HASH) {
      localStorage.setItem('site_unlocked', 'true');
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get('redirect') || '/index.html';
    } else {
      statusEl.textContent = "That's not quite right — try again.";
      statusEl.classList.add('error');
      input.value = '';
      input.focus();
    }
  });
})();
