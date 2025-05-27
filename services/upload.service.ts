import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private isImageFile(extension: string): boolean {
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".gif",
      ".png",
      ".avif",
      ".webp",
      ".svg",
    ];
    return allowedExtensions.includes(extension);
  }

  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error("Error cleaning up temp file:", error);
    }
  }

  async uploadFile(file: Express.Multer.File) {
    if (!file || file.size === 0) {
      throw new Error("File is empty");
    }

    const extension = path.extname(file.originalname).toLowerCase();
    if (!extension || !this.isImageFile(extension)) {
      await this.cleanupTempFile(file.path);
      throw new Error("Invalid file type");
    }

    return await this.uploadSingleFileAsync(file);
  }

  async uploadFiles(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new Error("No files provided for upload");
    }

    const uploadResponses = [];
    const failedUploads: string[] = [];

    for (const file of files) {
      try {
        if (!file || file.size === 0) {
          await this.cleanupTempFile(file.path);
          continue;
        }

        const extension = path.extname(file.originalname).toLowerCase();
        if (!extension || !this.isImageFile(extension)) {
          await this.cleanupTempFile(file.path);
          continue;
        }

        const response = await this.uploadSingleFileAsync(file);
        uploadResponses.push(response);
      } catch (error) {
        await this.cleanupTempFile(file.path);
        failedUploads.push(file.originalname);
        console.error(`Failed to upload ${file.originalname}:`, error);
      }
    }

    if (failedUploads.length > 0) {
      console.warn(`Failed to upload files: ${failedUploads.join(", ")}`);
    }

    return uploadResponses;
  }

  private async uploadSingleFileAsync(file: Express.Multer.File) {
    try {
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: process.env.CLOUDINARY_FOLDER || "uploads",
        resource_type: "auto",
        use_filename: true,
        unique_filename: false,
      });

      await this.cleanupTempFile(file.path);

      return {
        fileName: uploadResult.public_id,
        publicUrl: uploadResult.secure_url,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      await this.cleanupTempFile(file.path);
      throw new Error((error as Error).message || "Upload failed");
    }
  }
}

export const uploadService = new UploadService();
export default uploadService;
