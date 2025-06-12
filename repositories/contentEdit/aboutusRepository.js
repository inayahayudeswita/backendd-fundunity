// aboutUsRepository
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class AboutUsRepository {
  async findAll() {
    return await prisma.aboutUs.findMany();
  }

  async findById(id) {
    return await prisma.aboutUs.findUnique({
      where: { id: Number(id) },
    });
  }

  async create(aboutUsData) {
    return await prisma.aboutUs.create({
      data: aboutUsData,
    });
  }

  async update(id, aboutUsData) {
    return await prisma.aboutUs.update({
      where: { id: Number(id) },
      data: aboutUsData,
    });
  }

  async delete(id) {
    return await prisma.aboutUs.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = AboutUsRepository;
