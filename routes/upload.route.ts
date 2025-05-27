import { Router } from "express";
import { upload } from "../utils/multer";
import uploadController from "../controllers/upload.controller";
import validateJWT from "../middlewares/validateJWT";

const uploadRouter = Router();

uploadRouter.use(validateJWT);

uploadRouter.post(
  "/",
  upload.single("file"),
  uploadController.uploadSinlgeFile
);

uploadRouter.post(
  "/multiple",
  upload.array("files", 10),
  uploadController.uploadMultipleFiles
);

export default uploadRouter;
