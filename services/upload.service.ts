import path from "path";
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

  async uploadFile(file: Express.Multer.File) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new Error("File is empty or no buffer available");
    }

    const extension = path.extname(file.originalname).toLowerCase();
    if (!extension || !this.isImageFile(extension)) {
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
        if (!file || !file.buffer || file.buffer.length === 0) {
          continue;
        }

        const extension = path.extname(file.originalname).toLowerCase();
        if (!extension || !this.isImageFile(extension)) {
          continue;
        }

        const response = await this.uploadSingleFileAsync(file);
        uploadResponses.push(response);
      } catch (error) {
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
    console.log("Uploading file:", file.originalname);
    try {
      // Upload directly from buffer instead of file path
      const uploadResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        {
          folder: process.env.CLOUDINARY_FOLDER || "uploads",
          resource_type: "auto",
          use_filename: true,
          unique_filename: false,
          public_id: path.parse(file.originalname).name, // Use original filename without extension
        }
      );

      return {
        fileName: uploadResult.public_id,
        publicUrl: uploadResult.secure_url,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  }
}

export const uploadService = new UploadService();
export default uploadService;
