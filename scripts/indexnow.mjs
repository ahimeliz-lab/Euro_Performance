import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const SITE_HOST = process.env.INDEXNOW_HOST || "europerformancefl.com";
const ENDPOINT = process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow";
const SITEMAP_PATH = process.env.INDEXNOW_SITEMAP_PATH || "sitemap.xml";

function readKey() {
  if (process.env.INDEXNOW_KEY && process.env.INDEXNOW_KEY.trim()) {
    return process.env.INDEXNOW_KEY.trim();
  }

  const files = fs
    .readdirSync(process.cwd(), { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /^[a-f0-9]{32}\.txt$/i.test(name))
    .sort();

  if (!files.length) {
    throw new Error(
      "No IndexNow key file found. Add a root file like <32-hex-key>.txt or set INDEXNOW_KEY."
    );
  }

  const keyFilename = files[0];
  const keyFromFilename = path.basename(keyFilename, ".txt");
  const keyFromFile = fs.readFileSync(path.join(process.cwd(), keyFilename), "utf8").trim();
  const key = keyFromFile || keyFromFilename;

  if (key.toLowerCase() !== keyFromFilename.toLowerCase()) {
    throw new Error(
      `IndexNow key mismatch: ${keyFilename} filename and file contents must match.`
    );
  }

  return key;
}

function readUrlsFromSitemap() {
  const sitemapFile = path.join(process.cwd(), SITEMAP_PATH);
  if (!fs.existsSync(sitemapFile)) {
    throw new Error(`Sitemap not found at ${SITEMAP_PATH}.`);
  }

  const xml = fs.readFileSync(sitemapFile, "utf8");
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)];
  return matches.map((match) => match[1].trim()).filter(Boolean);
}

function readUrls() {
  const fromEnv = (process.env.INDEXNOW_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  const urls = fromEnv.length ? fromEnv : readUrlsFromSitemap();
  const unique = [...new Set(urls)];

  if (!unique.length) {
    throw new Error("No URLs found to submit to IndexNow.");
  }

  return unique;
}

function postJson(urlString, payload) {
  return new Promise((resolve, reject) => {
    const target = new URL(urlString);
    const body = JSON.stringify(payload);

    const req = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-length": Buffer.byteLength(body)
        }
      },
      (res) => {
        let responseBody = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 0,
            body: responseBody
          });
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const key = readKey();
  const keyLocation =
    process.env.INDEXNOW_KEY_LOCATION || `https://${SITE_HOST}/${key}.txt`;
  const urlList = readUrls();

  const payload = {
    host: SITE_HOST,
    key,
    keyLocation,
    urlList
  };

  if (process.env.INDEXNOW_DRY_RUN === "1") {
    console.log("INDEXNOW_DRY_RUN=1, payload preview:");
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`Submitting ${urlList.length} URL(s) to IndexNow for ${SITE_HOST}...`);
  const result = await postJson(ENDPOINT, payload);
  console.log(`IndexNow response status: ${result.statusCode}`);

  if (result.body) {
    console.log(result.body);
  }

  if (result.statusCode < 200 || result.statusCode >= 300) {
    throw new Error(`IndexNow submission failed with status ${result.statusCode}.`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
