const SALT = 'salt';         
const PASSWORD = 'wadmc';       
const PASSWORD_LENGTH = PASSWORD.length;

async function hashPassword(password, salt) {
  const buffer = new TextEncoder().encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function setCookie(name, value, days = 10) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}`;
}
function getCookie(name) {
  return document.cookie.split('; ').reduce((r, v) => {
    const [k, val] = v.split('=');
    return k === name ? decodeURIComponent(val) : r;
  }, null);
}
function deleteCookie(name) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

async function showNotFoundOverlay(expectedHash) {
  document.open();
  document.write(`
    <h1>404 Not Found</h1>
    <script>
      (function(){
        let buf = '';
        window.addEventListener('keydown', async function(e) {
          buf += e.key;
          if (buf.length >= ${PASSWORD_LENGTH}) {
            const salt = '${SALT}';
            const encoder = new TextEncoder();
            const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(buf + salt));
            const hashHex = Array.from(new Uint8Array(hashBuffer))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');
            if (hashHex === '${await hashPassword(PASSWORD, SALT)}') {
              document.cookie = 'auth=' + hashHex + '; path=/';
              location.reload();
            } else {
              buf = '';
            }
          }
        });
      })();
    <\/script>
  `);
  document.close();
  window.stop();
}

(async function() {
  const cookie = getCookie('auth');
  const expectedHash = await hashPassword(PASSWORD, SALT);
  if (cookie !== expectedHash) {
    deleteCookie('auth');
    await showNotFoundOverlay(expectedHash);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      const hidden = document.getElementById('hidden');
      if (hidden) hidden.style.display = 'block';
    });
  }
})();
