const { redis, pipeline, hashArrayToObject } = require("./_redis");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const [rawLeaders, rawTotals] = await Promise.all([
      redis(["ZREVRANGE", "captcha:leaderboard", 0, 19, "WITHSCORES"]),
      redis(["HGETALL", "captcha:totals"])
    ]);

    const ids = [];
    const scores = {};

    for (let i = 0; i < (rawLeaders || []).length; i += 2) {
      const id = rawLeaders[i];
      ids.push(id);
      scores[id] = Number(rawLeaders[i + 1] || 0);
    }

    let profiles = [];
    if (ids.length) {
      profiles = await pipeline(ids.map(id => ["HGETALL", `captcha:user:${id}`]));
    }

    const leaderboard = ids.map((id, i) => {
      const profile = hashArrayToObject(profiles[i]);
      return {
        name: profile.display || id,
        hcaptcha: Number(profile.hcaptcha || 0),
        recaptcha: Number(profile.recaptcha || 0),
        total: Number(scores[id] || 0)
      };
    });

    const totalsObj = hashArrayToObject(rawTotals);

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({
      leaderboard,
      totals: {
        hcaptcha: Number(totalsObj.hcaptcha || 0),
        recaptcha: Number(totalsObj.recaptcha || 0)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: process.env.NODE_ENV === "development"
        ? error.message
        : "Leaderboard is not configured."
    });
  }
};
