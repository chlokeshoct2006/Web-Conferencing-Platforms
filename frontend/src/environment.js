// ✅ FIXED: IS_PROD was hardcoded to true and pointed to a different project's backend URL
//           Set to false for local development; change to true + update URL for your own deployment
let IS_PROD = false;

const server = IS_PROD
    ? "https://YOUR_DEPLOYED_BACKEND_URL.onrender.com"  // ← Replace with your actual deployment URL
    : "http://localhost:8000";

export default server;
