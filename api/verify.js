const { pipeline } = require("./_redis");

function cleanUsername(input) {
  return String(input || "")
    .trim()
    .replace(/[^\p{L}\p{N}_ .-]/gu, "")
    .replace(/\s+/g, " ")
    .slice(0, 24);
}

async function verifyCaptcha(provider, token, remoteip) {
  const isH = provider === "hcaptcha";
  const secret = isH
    ? process.env.HCAPTCHA_SECRET_KEY
    : process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    throw new Error(`${isH ? "HCAPTCHA" : "RECAPTCHA"}_SECRET_KEY is not configured.`);
  }

  const url = isH
    ? "https://api.hcaptcha.com/siteverify"
    : "https://www.google.com/recaptcha/api/siteverify";

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (remoteip) form.set("remoteip", remoteip);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form
  });

  if (!response.ok) return false;
  const data = await response.json();
  return data.success === true;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  try {
    const { provider, token, username } = req.body || {};

    if (!["hcaptcha", "recaptcha"].includes(provider)) {
      return res.status(400).json({ ok: false, error: "Invalid CAPTCHA provider." });
    }

    const name = cleanUsername(username);
    if (name.length < 1) {
      return res.status(400).json({ ok: false, error: "Enter a leaderboard name." });
    }

    if (!token || typeof token !== "string") {
      return res.status(400).json({ ok: false, error: "Missing CAPTCHA token." });
    }

    const remoteip = String(req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim();

    const verified = await verifyCaptcha(provider, token, remoteip);
    if (!verified) {
      return res.status(400).json({ ok: false, error: "CAPTCHA verification failed." });
    }

    const id = name.toLocaleLowerCase("en-US");

    await pipeline([
      ["HSET", `captcha:user:${id}`, "display", name],
      ["HINCRBY", `captcha:user:${id}`, provider, 1],
      ["ZINCRBY", "captcha:leaderboard", 1, id],
      ["HINCRBY", "captcha:totals", provider, 1]
    ]);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: process.env.NODE_ENV === "development"
        ? error.message
        : "Server configuration or verification error."
    });
  }
};
