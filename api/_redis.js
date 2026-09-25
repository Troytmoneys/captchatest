const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error("Redis is not configured.");
  }

  const response = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    throw new Error(`Redis request failed: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function pipeline(commands) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error("Redis is not configured.");
  }

  const response = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(commands)
  });

  if (!response.ok) {
    throw new Error(`Redis pipeline failed: ${response.status}`);
  }

  const data = await response.json();
  for (const item of data) {
    if (item.error) throw new Error(item.error);
  }
  return data.map(item => item.result);
}

function hashArrayToObject(value) {
  if (!Array.isArray(value)) return {};
  const out = {};
  for (let i = 0; i < value.length; i += 2) {
    out[value[i]] = value[i + 1];
  }
  return out;
}

module.exports = { redis, pipeline, hashArrayToObject };
