(function () {
  // Set this to the /exec URL you get after deploying the Apps Script web app — see SETUP.md.
  const APPS_SCRIPT_URL = 'PASTE_YOUR_APPS_SCRIPT_URL_HERE';

  const form = document.getElementById('rsvp-form');
  if (!form) return;

  const statusEl = document.getElementById('rsvp-status');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    const formData = new FormData(form);

    if (!formData.get('name') || !formData.get('address') || !formData.get('city') || !formData.get('state') || !formData.get('zip')) {
      statusEl.textContent = 'Please fill in your name and mailing address.';
      statusEl.classList.add('error');
      return;
    }

    if (APPS_SCRIPT_URL.includes('PASTE_YOUR')) {
      statusEl.textContent = 'Submissions aren\'t connected yet — see SETUP.md to finish setup.';
      statusEl.classList.add('error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      // The Apps Script web app doesn't send CORS headers, so we use no-cors
      // and can't read the response — a successful fetch is treated as success.
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: new URLSearchParams(formData),
      });

      form.hidden = true;
      statusEl.textContent = 'Thank you! We\'ve added your address to our list.';
      statusEl.classList.add('success');
    } catch (err) {
      statusEl.textContent = 'Something went wrong sending your info — please try again or reach out to us directly.';
      statusEl.classList.add('error');
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
