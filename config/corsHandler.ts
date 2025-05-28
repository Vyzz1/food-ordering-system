import cors from "cors";

const corsHandler = cors({
  origin: ["http://localhost:3000", "https://foodyx-kappa.vercel.app"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

export default corsHandler;
