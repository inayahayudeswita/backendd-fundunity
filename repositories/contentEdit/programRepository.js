// programsRepository
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ProgramsRepository {
  async findAll() {
    return await prisma.programs.findMany();
  }

  async findById(id) {
    return await prisma.programs.findUnique({
      where: { id: Number(id) },
    });
  }

  async create(programData) {
    return await prisma.programs.create({
      data: programData,
    });
  }

  async update(id, programData) {
    return await prisma.programs.update({
      where: { id: Number(id) },
      data: programData,
    });
  }

  async delete(id) {
    return await prisma.programs.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = ProgramsRepository;
