const path = require("path");
// We can test using the built verifier or by inspecting email-verifier.ts logic
const dns = require("dns");

async function check() {
    const email = "thispersondefinitelydoesnotexist1234567@snapapp.com";
    console.log("Checking:", email);
}
check();
