import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
import authRouter from "./routes/auth.route";
import addressRouter from "./routes/address.route";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route";
import passwordRouter from "./routes/password.route";
import categoryRouter from "./routes/category.route";
import foodRoute from "./routes/food.route";
import uploadRouter from "./routes/upload.route";
import corsHandler from "./config/corsHandler";
import cartRouter from "./routes/cart.route";
import orderRoute from "./routes/order.route";
import ratingRoute from "./routes/rating.route";
import paymnetRoute from "./routes/payment.route";
import dashboardRoute from "./routes/dashboard.route";

dotenv.config();

const app = express();
app.use(corsHandler);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(
  "/api/payment",

  paymnetRoute
);

app.use(express.json());
app.use("/api/auth", authRouter);

app.use("/api/address", addressRouter);

app.use("/api/user", userRouter);

app.use("/api/password", passwordRouter);

app.use("/api/category", categoryRouter);

app.use("/api/food", foodRoute);

app.use("/api/upload", uploadRouter);

app.use("/api/cart", cartRouter);

app.use("/api/order", orderRoute);

app.use("/api/review", ratingRoute);

app.use("/api/dashboard", dashboardRoute);

const PORT = process.env.PORT || 6999;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
});
