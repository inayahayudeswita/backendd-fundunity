const OurPartnerService = require("../../services/contentEdit/ourPartnerService");
const service = new OurPartnerService();

class OurPartnerController {
  async getAllPartners(req, res) {
    try {
      const partners = await service.getAllOurPartners();
      res.json(partners);
    } catch (err) {
      console.error("Error getAllPartners:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getPartnerById(req, res) {
    try {
      const partner = await service.getOurPartnerById(req.params.id);
      res.json(partner);
    } catch (err) {
      console.error("Error getPartnerById:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async createPartner(req, res) {
    try {
      const { name } = req.body;
      const file = req.file || null;
      const newPartner = await service.createOurPartner(name, file);
      res.status(201).json(newPartner);
    } catch (err) {
      console.error("Error createPartner:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async updatePartner(req, res) {
    try {
      const { name } = req.body;
      const file = req.file || null;
      const updated = await service.updateOurPartner(req.params.id, name, file);
      res.json(updated);
    } catch (err) {
      console.error("Error updatePartner:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async deletePartner(req, res) {
    try {
      await service.deleteOurPartner(req.params.id);
      res.json({ message: "Partner deleted" });
    } catch (err) {
      console.error("Error deletePartner:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

module.exports = new OurPartnerController();