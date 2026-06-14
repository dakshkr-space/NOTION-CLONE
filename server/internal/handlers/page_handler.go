package handlers

import (
    "github.com/gofiber/fiber/v2"
    "github.com/dakshkr-space/NOTION-CLONE/internal/db"
    "github.com/dakshkr-space/NOTION-CLONE/internal/models"
)

// ─── CREATE PAGE ─────────────────────────────────────────────────────────────

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