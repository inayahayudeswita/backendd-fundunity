// backend/services/imageKitService.js
const imagekit = require("../config/imagekit");

class ImageKitService {
  async uploadFile(file, fileName) {
    try {
      const response = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: fileName,
        folder: "/programs",
      });

      return {
        url: response.url,
        fileId: response.fileId,
        thumbnailUrl: response.thumbnailUrl,
      };
    } catch (error) {
      console.error("ImageKit upload error:", error);
      throw new Error("Failed to upload file to ImageKit");
    }
  }

  async deleteFile(fileId) {
    try {
      await imagekit.deleteFile(fileId);
      return true;
    } catch (error) {
      console.error("ImageKit delete error:", error);
      throw new Error("Failed to delete file from ImageKit");
    }
  }
}

module.exports = new ImageKitService();
