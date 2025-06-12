// backend/services/contentEdit/aboutusService.js
const AboutUsRepository = require("../../repositories/contentEdit/aboutusRepository");
const imageKitService = require("../imageKitService");
const path = require("path");

class AboutUsService {
  constructor() {
    this.aboutUsRepository = new AboutUsRepository();
  }

  async getAllAboutUs() {
    return await this.aboutUsRepository.findAll();
  }

  async getAboutUsById(id) {
    return await this.aboutUsRepository.findById(id);
  }

  async createAboutUs(nama, description, file = null) {
    let aboutUsData = {
      nama,
      description,
    };

    // If a file is provided, upload it to ImageKit
    if (file) {
      const fileName = `aboutus_${Date.now()}${path.extname(
        file.originalname
      )}`;
      const uploadResult = await imageKitService.uploadFile(file, fileName);

      // Add the image information to the about us data
      aboutUsData.imageUrl = uploadResult.url;
      aboutUsData.imageId = uploadResult.fileId;
    }

    return await this.aboutUsRepository.create(aboutUsData);
  }

  async updateAboutUs(id, nama, description, file = null) {
    const existingAboutUs = await this.aboutUsRepository.findById(id);

    let aboutUsData = {
      nama: nama || existingAboutUs.nama,
      description: description || existingAboutUs.description,
    };

    // If a file is provided, upload the new file and delete the old one if exists
    if (file) {
      const fileName = `aboutus_${Date.now()}${path.extname(
        file.originalname
      )}`;
      const uploadResult = await imageKitService.uploadFile(file, fileName);

      // Add the image information to the about us data
      aboutUsData.imageUrl = uploadResult.url;
      aboutUsData.imageId = uploadResult.fileId;

      // Delete the old image if it exists
      if (existingAboutUs.imageId) {
        await imageKitService.deleteFile(existingAboutUs.imageId);
      }
    }

    return await this.aboutUsRepository.update(id, aboutUsData);
  }

  async deleteAboutUs(id) {
    const existingAboutUs = await this.aboutUsRepository.findById(id);

    // Delete the image from ImageKit if it exists
    if (existingAboutUs.imageId) {
      await imageKitService.deleteFile(existingAboutUs.imageId);
    }

    return await this.aboutUsRepository.delete(id);
  }
}

module.exports = AboutUsService;
