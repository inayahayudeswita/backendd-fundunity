const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class OurPartnersRepository {
  async findAll() {
    return await prisma.ourPartner.findMany();
  }

  async findById(id) {
    return await prisma.ourPartner.findUnique({
      where: { id: Number(id) },
    });
  }

  async create(partnerData) {
    return await prisma.ourPartner.create({
      data: partnerData,
    });
  }

  async update(id, partnerData) {
    return await prisma.ourPartner.update({
      where: { id: Number(id) },
      data: partnerData,
    });
  }

  async delete(id) {
    return await prisma.ourPartner.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = OurPartnersRepository;
