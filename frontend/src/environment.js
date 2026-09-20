const server = import.meta.env.PROD
  ? "https://video-conferencing-platfrom.onrender.com"
  : "http://localhost:8000";

export default server;
