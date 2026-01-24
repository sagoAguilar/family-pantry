import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env manually to avoid dependency issues
try {
  const envPath = path.resolve(__dirname, "../../.env");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf8");
    envFile.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ""); // strip quotes
        process.env[key] = value;
      }
    });
  } else {
    console.warn(".env file not found at " + envPath);
  }
} catch (e) {
  console.warn("Could not load .env file:", e);
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

console.log("URL:", supabaseUrl);
console.log("Key:", supabaseKey ? "Found ✓" : "Missing ✗");

const supabase = createClient(supabaseUrl!, supabaseKey!);

// Test query
supabase
  .from("families")
  .select("*")
  .then(({ data, error }) => {
    if (error) {
      console.error("Connection failed:", error.message);
    } else {
      console.log("Connection successful! ✓");
    }
  });
