// Verify a Google reCAPTCHA v2 token server-side using the account's secret key.
const verifyCaptchaToken = async (token) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey || !token) return false;

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: secretKey, response: token }),
    });
    const data = await response.json();
    return Boolean(data.success);
  } catch (error) {
    return false;
  }
};

module.exports = {
  verifyCaptchaToken,
};
