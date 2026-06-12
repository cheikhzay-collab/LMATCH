/**
 * Neutralise les caractères HTML/Script suspects pour prévenir les attaques XSS.
 * @param {string} str - La chaîne brute à nettoyer.
 * @returns {string}
 */
export function sanitizeInputString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Valide un numéro de téléphone selon un format standard (chiffres, espaces, tirets, +).
 * Autorise les numéros de 8 à 20 caractères.
 * @param {string} phone
 * @returns {boolean}
 */
export function validatePhoneNumber(phone) {
  if (typeof phone !== 'string') return false;
  const phoneRegex = /^[+0-9\s-]{8,20}$/;
  return phoneRegex.test(phone.trim());
}
