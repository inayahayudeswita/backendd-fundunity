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
    let partnerData = { name };

    if (file) {
      const fileName = `partner_${Date.now()}${path.extname(file.originalname)}`;
      const uploadResult = await imageKitService.uploadFile(file, fileName);
      partnerData.imageUrl = uploadResult.url;
      partnerData.imageId = uploadResult.fileId;
    }

    return await this.ourPartnerRepository.create(partnerData);
  }

  async updateOurPartner(id, name, file = null) {
    const existingPartner = await this.ourPartnerRepository.findById(id);

    let partnerData = { name: name || existingPartner.name };

    if (file) {
      const fileName = `partner_${Date.now()}${path.extname(file.originalname)}`;
      const uploadResult = await imageKitService.uploadFile(file, fileName);
      partnerData.imageUrl = uploadResult.url;
      partnerData.imageId = uploadResult.fileId;

      if (existingPartner.imageId) {
        await imageKitService.deleteFile(existingPartner.imageId);
      }
    }

    return await this.ourPartnerRepository.update(id, partnerData);
  }

  async deleteOurPartner(id) {
    const existingPartner = await this.ourPartnerRepository.findById(id);

    if (existingPartner.imageId) {
      await imageKitService.deleteFile(existingPartner.imageId);
    }

    return await this.ourPartnerRepository.delete(id);
  }
}

module.exports = OurPartnerService;
