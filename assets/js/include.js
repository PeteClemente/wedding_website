async function loadIncludes() {
  const includeElements = document.querySelectorAll('[data-include]');
  await Promise.all(
    Array.from(includeElements).map(async (el) => {
      const path = el.getAttribute('data-include');
      try {
        const res = await fetch(path);
        if (res.ok) {
          el.innerHTML = await res.text();
        }
      } catch (err) {
        console.error('Failed to load include:', path, err);
      }
    })
  );
  document.dispatchEvent(new Event('partialsLoaded'));
}

document.addEventListener('DOMContentLoaded', loadIncludes);
