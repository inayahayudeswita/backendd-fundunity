// backend/services/contentEdit/ourPartnerService.js
const OurPartnerRepository = require("../../repositories/contentEdit/ourPartnerRepositories");
const imageKitService = require("../imageKitService");
const path = require("path");

class OurPartnerService {
  constructor() {
    this.ourPartnerRepository = new OurPartnerRepository();
  }

  async getAllOurPartners() {
    return await this.ourPartnerRepository.findAll();
  }

  async getOurPartnerById(id) {
    return await this.ourPartnerRepository.findById(id);
  }

  async createOurPartner(name, file = null) {
    let partnerData = {
      name,
    };

    // If a file is provided, upload it to ImageKit
    if (file) {
      const fileName = `partner_${Date.now()}${path.extname(
        file.originalname
      )}`;
      const uploadResult = await imageKitService.uploadFile(file, fileName);

      // Add the image information to the partner data
      partnerData.imageUrl = uploadResult.url;
      partnerData.imageId = uploadResult.fileId;
    }

    return await this.ourPartnerRepository.create(partnerData);
  }

  async updateOurPartner(id, name, file = null) {
    const existingPartner = await this.ourPartnerRepository.findById(id);

    let partnerData = {
      name: name || existingPartner.name,
    };

    // If a file is provided, upload the new file and delete the old one if exists
    if (file) {
      const fileName = `partner_${Date.now()}${path.extname(
        file.originalname
      )}`;
      const uploadResult = await imageKitService.uploadFile(file, fileName);

      // Add the image information to the partner data
      partnerData.imageUrl = uploadResult.url;
      partnerData.imageId = uploadResult.fileId;

      // Delete the old image if it exists
      if (existingPartner.imageId) {
        await imageKitService.deleteFile(existingPartner.imageId);
      }
    }

    return await this.ourPartnerRepository.update(id, partnerData);
  }

  async deleteOurPartner(id) {
    const existingPartner = await this.ourPartnerRepository.findById(id);

    // Delete the image from ImageKit if it exists
    if (existingPartner.imageId) {
      await imageKitService.deleteFile(existingPartner.imageId);
    }

    return await this.ourPartnerRepository.delete(id);
  }
}

module.exports = OurPartnerService;
