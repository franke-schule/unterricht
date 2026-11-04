// Nur Arbeitsspeicher der geöffneten Seite. Der Server prüft jeden Aufruf erneut.
let rememberedPassword = '';
let pendingPrompt;

export function encodeAccessPassword(password) {
  if (typeof password !== 'string' || !password.length || /\p{Cc}/u.test(password)) {
    throw new Error('Bitte gib dein Unterrichtspasswort ein.');
  }
  const bytes = new TextEncoder().encode(password);
  if (bytes.length > 256) throw new Error('Das Unterrichtspasswort ist zu lang (höchstens 256 UTF-8-Bytes).');
  return btoa(String.fromCharCode(...bytes));
}

export function forgetAccessPassword(password = rememberedPassword) {
  if (rememberedPassword === password) rememberedPassword = '';
}

function showPasswordPrompt() {
  if (typeof document === 'undefined') throw new Error('Bitte gib das Unterrichtspasswort auf der Aufgabenseite ein.');
  if (!document.getElementById('ai-access-styles')) {
    const link = document.createElement('link');
    link.id = 'ai-access-styles'; link.rel = 'stylesheet';
    link.href = new URL('./ai-access.css?v=20261104-password-v1', import.meta.url).href;
    document.head.append(link);
  }
  return new Promise((resolve, reject) => {
    const previousFocus = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.id = 'ai-access-dialog';
    dialog.setAttribute('aria-labelledby', 'ai-access-title');
    dialog.setAttribute('aria-describedby', 'ai-access-description');
    dialog.innerHTML = `<form method="dialog">
      <h2 id="ai-access-title">KI-Prüfung freischalten</h2>
      <p id="ai-access-description">Gib das Unterrichtspasswort ein. Es gilt bis zum Verlassen oder Neuladen dieser Seite.</p>
      <label for="ai-access-password">Unterrichtspasswort</label>
      <input id="ai-access-password" type="password" autocomplete="off" required autofocus>
      <p id="ai-access-error" role="alert" hidden></p>
      <div class="ai-access-actions">
        <button type="button" data-cancel>Abbrechen</button>
        <button type="submit" class="primary-button">Prüfung starten</button>
      </div>
    </form>`;
    const input = dialog.querySelector('input');
    const error = dialog.querySelector('[role="alert"]');
    let acceptedPassword = '';
    dialog.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      try {
        encodeAccessPassword(input.value);
        acceptedPassword = input.value;
        dialog.close();
      } catch (failure) {
        error.textContent = failure.message; error.hidden = false; input.focus();
      }
    });
    dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      input.value = ''; dialog.remove();
      if (previousFocus?.isConnected) previousFocus.focus();
      if (acceptedPassword) resolve(acceptedPassword);
      else reject(Object.assign(new Error('Die KI-Prüfung wurde abgebrochen. Deine Eingabe bleibt erhalten.'), { code: 'AUTH_CANCELLED' }));
    }, { once: true });
    document.body.append(dialog);
    try { dialog.showModal(); }
    catch (failure) { input.value = ''; dialog.remove(); reject(failure); }
  });
}

export async function getAccessPassword() {
  if (rememberedPassword) return rememberedPassword;
  if (!pendingPrompt) {
    pendingPrompt = showPasswordPrompt().then(password => {
      rememberedPassword = password;
      return password;
    }).finally(() => { pendingPrompt = undefined; });
  }
  return pendingPrompt;
}

globalThis.addEventListener?.('pagehide', () => forgetAccessPassword());
