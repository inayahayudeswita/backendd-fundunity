// backend/controllers/contentEdit/imageSliderController.js
const ImageSliderService = require("../../services/contentEdit/imageSliderService");
const imageSliderService = new ImageSliderService();

class ImageSliderController {
  // Get all image sliders
  async getAllImageSliders(req, res) {
    try {
      const imageSliders = await imageSliderService.getAllImageSliders();
      res.status(200).json(imageSliders);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch image sliders",
        details: error.message,
      });
    }
  }

  // Get image slider by ID
  async getImageSliderById(req, res) {
    try {
      const { id } = req.params;
      const imageSlider = await imageSliderService.getImageSliderById(
        Number(id)
      );

      if (!imageSlider) {
        return res.status(404).json({ error: "Image slider not found" });
      }

      res.status(200).json(imageSlider);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch image slider",
        details: error.message,
      });
    }
  }

  // Create a new image slider
  async createImageSlider(req, res) {
    try {
      const { title, description } = req.body;
      const file = req.file; // File from Multer

      if (!title || !description) {
        return res
          .status(400)
          .json({ error: "Title and description are required" });
      }

      const newImageSlider = await imageSliderService.createImageSlider(
        title,
        description,
        file
      );
      res.status(201).json(newImageSlider);
    } catch (error) {
      res.status(500).json({
        error: "Failed to create image slider",
        details: error.message,
      });
    }
  }

  // Update an image slider
  async updateImageSlider(req, res) {
    try {
      const { id } = req.params;
      const { title, description } = req.body;
      const file = req.file; // File from Multer

      const updatedImageSlider = await imageSliderService.updateImageSlider(
        Number(id),
        title,
        description,
        file
      );

      res.status(200).json(updatedImageSlider);
    } catch (error) {
      res.status(500).json({
        error: "Failed to update image slider",
        details: error.message,
      });
    }
  }

  // Delete an image slider
  async deleteImageSlider(req, res) {
    try {
      const { id } = req.params;

      await imageSliderService.deleteImageSlider(Number(id));
      res.status(200).json({ message: "Image slider deleted successfully" });
    } catch (error) {
      res.status(500).json({
        error: "Failed to delete image slider",
        details: error.message,
      });
    }
  }
}

module.exports = new ImageSliderController();
