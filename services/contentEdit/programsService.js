// backend/services/contentEdit/programsService.js
const ProgramsRepository = require("../../repositories/contentEdit/programRepository");
const imageKitService = require("../imageKitService");
const path = require("path");

class ProgramsService {
  constructor() {
    this.programsRepository = new ProgramsRepository();
  }

  async getAllPrograms() {
    return await this.programsRepository.findAll();
  }

  async getProgramById(id) {
    return await this.programsRepository.findById(id);
  }

  async createProgram(title, description, file = null) {
    let programData = {
      title,
      description,
    };

    // If a file is provided, upload it to ImageKit
    if (file) {
      const fileName = `program_${Date.now()}${path.extname(
        file.originalname
      )}`;
      const uploadResult = await imageKitService.uploadFile(file, fileName);

      // Add the image information to the program data
      programData.imageUrl = uploadResult.url;
      programData.imageId = uploadResult.fileId;
    }

    return await this.programsRepository.create(programData);
  }

  async updateProgram(id, title, description, file = null) {
    const existingProgram = await this.programsRepository.findById(id);

    let programData = {
      title: title || existingProgram.title,
      description: description || existingProgram.description,
    };

    // If a file is provided, upload the new file and delete the old one if exists
    if (file) {
      const fileName = `program_${Date.now()}${path.extname(
        file.originalname
      )}`;
      const uploadResult = await imageKitService.uploadFile(file, fileName);

      // Add the image information to the program data
      programData.imageUrl = uploadResult.url;
      programData.imageId = uploadResult.fileId;

      // Delete the old image if it exists
      if (existingProgram.imageId) {
        await imageKitService.deleteFile(existingProgram.imageId);
      }
    }

    return await this.programsRepository.update(id, programData);
  }

  async deleteProgram(id) {
    const existingProgram = await this.programsRepository.findById(id);

    // Delete the image from ImageKit if it exists
    if (existingProgram.imageId) {
      await imageKitService.deleteFile(existingProgram.imageId);
    }

    return await this.programsRepository.delete(id);
  }
}

module.exports = ProgramsService;
