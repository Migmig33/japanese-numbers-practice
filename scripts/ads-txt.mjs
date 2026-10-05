// Writes public/ads.txt from the publisher id so there is one source of truth for it.
// AdSense flags a site whose ads.txt is missing or names the wrong publisher, and the
// file has to sit at the domain root — which, for a static export, means public/.
import { readFileSync, rmSync, writeFileSync } from "node:fs";

const OUT = new URL("../public/ads.txt", import.meta.url);
const KEY = "NEXT_PUBLIC_ADSENSE_CLIENT";

function read(path) {
  try {
    return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  } catch {
    return "";
  }
}

/** Next reads .env.local itself, but this runs before Next does. */
function fromEnvFile() {
  for (const file of [".env.local", ".env"]) {
    const line = read(file).split("\n").find((l) => l.trim().startsWith(`${KEY}=`));
    if (line) {
      const value = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
      if (value) return value;
    }
  }
  return "";
}

/** The id lives in lib/ads.ts, which is TypeScript and so can't just be imported here. */
function fromSource() {
  return read("lib/ads.ts").match(/ca-pub-\d+/)?.[0] ?? "";
}

const client = (process.env[KEY] || fromEnvFile() || fromSource()).trim();

if (!client) {
  rmSync(OUT, { force: true });
  console.log("ads.txt: no publisher id set, skipping");
} else {
  // ads.txt wants the bare pub-… id, without the ca- prefix the script tag uses.
  const pub = client.replace(/^ca-/, "");
  writeFileSync(OUT, `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
  console.log(`ads.txt: ${pub}`);
}
