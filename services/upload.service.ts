import path from "path";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";

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
    try {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        {
          folder: process.env.CLOUDINARY_FOLDER || "uploads",
          resource_type: "auto",
          use_filename: true,
          unique_filename: false,
          public_id: path.parse(file.originalname).name,
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
  async uploadFromUrl(
    imageUrl: string,
    fileName?: string
  ): Promise<{
    fileName: string;
    publicUrl: string;
    uploadedAt: string;
  }> {
    if (!imageUrl) {
      throw new Error("No image URL provided");
    }

    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });

      const contentType = response.headers["content-type"];

      const customFileName = fileName || `url-image-${Date.now()}`;

      const uploadResult = await cloudinary.uploader.upload(
        `data:${contentType};base64,${Buffer.from(response.data).toString("base64")}`,
        {
          folder: process.env.CLOUDINARY_FOLDER || "uploads",
          resource_type: "auto",
          use_filename: true,
          unique_filename: true,
          public_id: customFileName,
        }
      );

      return {
        fileName: uploadResult.public_id,
        publicUrl: uploadResult.secure_url,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error uploading image from URL:", error);
      throw new Error(`Failed to upload image from URL: ${error}`);
    }
  }
}

export const uploadService = new UploadService();
export default uploadService;
