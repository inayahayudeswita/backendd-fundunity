// backend/repositories/contentEdit/imageSliderRepository.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ImageSliderRepository {
  async findAll() {
    return await prisma.imageSlider.findMany();
  }

  async findById(id) {
    return await prisma.imageSlider.findUnique({
      where: { id: Number(id) },
    });
  }

  async create(data) {
    return await prisma.imageSlider.create({
      data,
    });
  }

  async update(id, data) {
    return await prisma.imageSlider.update({
      where: { id: Number(id) },
      data,
    });
  }

  async delete(id) {
    return await prisma.imageSlider.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = ImageSliderRepository;
