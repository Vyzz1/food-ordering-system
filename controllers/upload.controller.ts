import { Request, Response } from "express";
import uploadService from "../services/upload.service";
import errorHandler from "../utils/error";
import { TypedRequest } from "../types/express";

class UploadController {
  async uploadSinlgeFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
      }

      const result = await uploadService.uploadFile(req.file!);

      res.status(201).send(result);
    } catch (error) {
      console.error("Error uploading file:", error);
      errorHandler(error, res);
    }
  }

  async uploadMultipleFiles(req: Request, res: Response) {
    try {
      if (!req.files || req.files.length === 0) {
        res.status(400).json({ message: "No files uploaded" });
      }

      const results = await uploadService.uploadFiles(
        req.files as Express.Multer.File[]
      );

      res.status(201).send(results);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async uploadFileFromUrl(
    req: TypedRequest<{ TBody: { fileUrl: string } }>,
    res: Response
  ) {
    try {
      const { fileUrl } = req.body;

      if (!fileUrl) {
        res.status(400).json({ message: "File URL is required" });
      }

      const result = await uploadService.uploadFromUrl(fileUrl);

      res.status(201).send(result);
    } catch (error) {
      console.error("Error uploading file from URL:", error);
      errorHandler(error, res);
    }
  }
}

export const uploadController = new UploadController();
export default uploadController;
