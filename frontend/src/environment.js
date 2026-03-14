// ✅ FIXED: IS_PROD was hardcoded to true and pointed to a different project's backend URL
//           Set to false for local development; change to true + update URL for your own deployment
let IS_PROD = true;

const server = IS_PROD
    ? "https://web-conferencing-platforms-backend.onrender.com"  // ← Replace with your actual deployment URL
    : "http://localhost:8000";

export default server;
