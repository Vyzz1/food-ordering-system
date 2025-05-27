import cors from "cors";

const corsHandler = cors({
  origin: ["http://localhost:3000", "https://your-production-domain.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

export default corsHandler;
