// backend/services/contentEdit/imageSliderService.js
const ImageSliderRepository = require("../../repositories/contentEdit/imageSliderRepositories");
const imageKitService = require("../imageKitService");
const path = require("path");

class ImageSliderService {
  constructor() {
    this.imageSliderRepository = new ImageSliderRepository();
  }

  async getAllImageSliders() {
    return await this.imageSliderRepository.findAll();
  }

  async getImageSliderById(id) {
    return await this.imageSliderRepository.findById(id);
  }

  async createImageSlider(title, description, file = null) {
    let imageSliderData = {
      title,
      description,
    };

    // If a file is provided, upload it to ImageKit
    if (file) {
      const fileName = `slider_${Date.now()}${path.extname(file.originalname)}`;
      const uploadResult = await imageKitService.uploadFile(file, fileName);

      // Add the image information to the image slider data
      imageSliderData.imageUrl = uploadResult.url;
      imageSliderData.imageId = uploadResult.fileId;
    }

    return await this.imageSliderRepository.create(imageSliderData);
  }

  async updateImageSlider(id, title, description, file = null) {
    const existingImageSlider = await this.imageSliderRepository.findById(id);

    let imageSliderData = {
      title: title || existingImageSlider.title,
      description: description || existingImageSlider.description,
    };

    // If a file is provided, upload the new file and delete the old one if exists
    if (file) {
      const fileName = `slider_${Date.now()}${path.extname(file.originalname)}`;
      const uploadResult = await imageKitService.uploadFile(file, fileName);

      // Add the image information to the image slider data
      imageSliderData.imageUrl = uploadResult.url;
      imageSliderData.imageId = uploadResult.fileId;

      // Delete the old image if it exists
      if (existingImageSlider.imageId) {
        await imageKitService.deleteFile(existingImageSlider.imageId);
      }
    }

    return await this.imageSliderRepository.update(id, imageSliderData);
  }

  async deleteImageSlider(id) {
    const existingImageSlider = await this.imageSliderRepository.findById(id);

    // Delete the image from ImageKit if it exists
    if (existingImageSlider.imageId) {
      await imageKitService.deleteFile(existingImageSlider.imageId);
    }

    return await this.imageSliderRepository.delete(id);
  }
}

module.exports = ImageSliderService;
