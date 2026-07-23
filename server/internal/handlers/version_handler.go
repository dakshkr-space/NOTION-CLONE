package handlers

import (
	"github.com/dakshkr-space/NOTION-CLONE/internal/db"
	"github.com/dakshkr-space/NOTION-CLONE/internal/models"
	"github.com/gofiber/fiber/v2"
)

func GetPageVersions(c *fiber.Ctx) error {
	pageID := c.Params("id")

	var versions []models.PageVersion
	if err := db.DB.Preload("CreatedBy").
		Where("page_id = ?", pageID).
		Order("created_at desc").
		Find(&versions).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch versions"})
	}

	return c.JSON(versions)
}

func RestorePageVersion(c *fiber.Ctx) error {
	userIDFloat, ok := c.Locals("userID").(float64)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid user token session"})
	}
	userID := uint(userIDFloat)
	pageID := c.Params("id")
	versionID := c.Params("versionId")

	var version models.PageVersion
	if err := db.DB.Where("id = ? AND page_id = ?", versionID, pageID).First(&version).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Version snapshot not found"})
	}

	var page models.Page
	if err := db.DB.Where("id = ?", pageID).First(&page).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Page not found"})
	}

	currentSnapshot := models.PageVersion{
		PageID:      page.ID,
		Title:       page.Title,
		Content:     page.Content,
		CreatedByID: userID,
	}
	db.DB.Create(&currentSnapshot)

	page.Title = version.Title
	page.Content = version.Content
	db.DB.Save(&page)

	return c.JSON(fiber.Map{"message": "Page restored successfully", "page": page})
}
