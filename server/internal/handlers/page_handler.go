package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"log"

	"github.com/dakshkr-space/NOTION-CLONE/internal/db"
	"github.com/dakshkr-space/NOTION-CLONE/internal/models"
	"github.com/gofiber/fiber/v2"
)

func CreatePage(c *fiber.Ctx) error {

	userID := uint(c.Locals("userID").(float64))

	var body struct {
		Title    string `json:"title"`
		Content  string `json:"content"`
		ParentID *uint  `json:"parent_id"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	if body.Title == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Title is required"})
	}

	page := models.Page{
		UserID:   userID,
		Title:    body.Title,
		Content:  body.Content,
		ParentID: body.ParentID,
	}

	if err := db.DB.Create(&page).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create page"})
	}

	return c.Status(201).JSON(page)
}

func GetPages(c *fiber.Ctx) error {

	userID := uint(c.Locals("userID").(float64))

	var pages []models.Page

	if err := db.DB.Where("user_id = ?", userID).Find(&pages).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch pages"})
	}

	return c.JSON(pages)
}

func GetPage(c *fiber.Ctx) error {

	userID := uint(c.Locals("userID").(float64))

	id := c.Params("id")

	var page models.Page

	if err := db.DB.Where("id = ? AND user_id = ?", id, userID).First(&page).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Page not found"})
	}

	return c.JSON(page)
}

func UpdatePage(c *fiber.Ctx) error {

	userID := uint(c.Locals("userID").(float64))
	id := c.Params("id")

	var page models.Page
	if err := db.DB.Where("id = ? AND user_id = ?", id, userID).First(&page).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Page not found"})
	}

	var body struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	version := models.PageVersion{
		PageID:      page.ID,
		Title:       page.Title,
		Content:     page.Content,
		CreatedByID: userID,
	}

	if err := db.DB.Create(&version).Error; err != nil {
		log.Printf("failed to create page version: %v", err)
	}

	if err := db.DB.Model(&page).Updates(models.Page{
		Title:   body.Title,
		Content: body.Content,
	}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update page"})
	}

	return c.JSON(page)
}

func DeletePage(c *fiber.Ctx) error {

	userID := uint(c.Locals("userID").(float64))
	id := c.Params("id")

	var page models.Page
	if err := db.DB.Where("id = ? AND user_id = ?", id, userID).First(&page).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Page not found"})
	}

	if err := db.DB.Delete(&page).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete page"})
	}

	return c.JSON(fiber.Map{"message": "Page deleted"})
}

func GetChildPages(c *fiber.Ctx) error {
	userID := uint(c.Locals("userID").(float64))
	parentID := c.Params("id")

	var pages []models.Page
	if err := db.DB.Where("parent_id = ? AND user_id = ?", parentID, userID).Find(&pages).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch child pages"})
	}

	return c.JSON(pages)
}

func SharePage(c *fiber.Ctx) error {
	userID := uint(c.Locals("userID").(float64))
	id := c.Params("id")

	var page models.Page
	if err := db.DB.Where("id = ? AND user_id = ?", id, userID).First(&page).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Page not found"})
	}

	// Generates a random 16-byte hex token
	bytes := make([]byte, 16)
	rand.Read(bytes)
	token := hex.EncodeToString(bytes)

	if err := db.DB.Model(&page).Update("share_token", token).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate share link"})
	}

	return c.JSON(fiber.Map{
		"share_token": token,
		"share_url":   "http://localhost:3001/shared/" + token,
	})
}

func GetSharedPage(c *fiber.Ctx) error {
	token := c.Params("token")

	var page models.Page
	if err := db.DB.Where("share_token = ?", token).First(&page).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Page not found or link expired"})
	}

	return c.JSON(page)
}
