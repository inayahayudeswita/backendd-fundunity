// backend/controllers/contentEdit/ourPartnerController.js
const OurPartnerService = require("../../services/contentEdit/ourPartnerService");
const ourPartnerService = new OurPartnerService();

class OurPartnerController {
  // Get all Our Partner entries
  async getAllOurPartners(req, res) {
    try {
      const ourPartnerEntries = await ourPartnerService.getAllOurPartners();
      res.status(200).json(ourPartnerEntries);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch Our Partner entries",
        details: error.message,
      });
    }
  }

  // Get Our Partner entry by ID
  async getOurPartnerById(req, res) {
    try {
      const { id } = req.params;
      const ourPartner = await ourPartnerService.getOurPartnerById(Number(id));

      if (!ourPartner) {
        return res.status(404).json({ error: "Our Partner not found" });
      }

      res.status(200).json(ourPartner);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch Our Partner", details: error.message });
    }
  }

  // Create new Our Partner entry
  async createOurPartner(req, res) {
    try {
      const { name } = req.body;
      const file = req.file; // This comes from Multer

      if (!name) {
        return res.status(400).json({ error: "Name are required" });
      }

      const newOurPartner = await ourPartnerService.createOurPartner(
        name,
        file
      );
      res.status(201).json(newOurPartner);
    } catch (error) {
      res.status(500).json({
        error: "Failed to create Our Partner",
        details: error.message,
      });
    }
  }

  // Update Our Partner entry
  async updateOurPartner(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const file = req.file; // This comes from Multer

      const existingOurPartner = await ourPartnerService.getOurPartnerById(
        Number(id)
      );

      if (!existingOurPartner) {
        return res.status(404).json({ error: "Our Partner not found" });
      }

      const updatedOurPartner = await ourPartnerService.updateOurPartner(
        Number(id),
        name || existingOurPartner.name,
        file
      );

      res.status(200).json(updatedOurPartner);
    } catch (error) {
      res.status(500).json({
        error: "Failed to update Our Partner",
        details: error.message,
      });
    }
  }

  // Delete Our Partner entry
  async deleteOurPartner(req, res) {
    try {
      const { id } = req.params;

      const existingOurPartner = await ourPartnerService.getOurPartnerById(
        Number(id)
      );

      if (!existingOurPartner) {
        return res.status(404).json({ error: "Our Partner not found" });
      }

      await ourPartnerService.deleteOurPartner(Number(id));
      res.status(200).json({ message: "Our Partner deleted successfully" });
    } catch (error) {
      res.status(500).json({
        error: "Failed to delete Our Partner",
        details: error.message,
      });
    }
  }
}

module.exports = new OurPartnerController();
