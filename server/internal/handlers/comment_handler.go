package handlers

import (
	"regexp"
	"strconv"
	"strings"

	"github.com/dakshkr-space/NOTION-CLONE/internal/db"
	"github.com/dakshkr-space/NOTION-CLONE/internal/models"
	"github.com/gofiber/fiber/v2"
)

func GetComments(c *fiber.Ctx) error {
	pageID := c.Params("id")

	var comments []models.Comment
	if err := db.DB.Preload("User").Preload("Mentions").
		Where("page_id = ?", pageID).
		Order("created_at asc").
		Find(&comments).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to load comments"})
	}

	return c.JSON(comments)
}

func AddComment(c *fiber.Ctx) error {
	userIDFloat, ok := c.Locals("userID").(float64)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid user token session"})
	}
	userID := uint(userIDFloat)
	pageIDStr := c.Params("id")

	pageID, err := strconv.ParseUint(pageIDStr, 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid page ID"})
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := c.BodyParser(&req); err != nil || strings.TrimSpace(req.Content) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Comment content cannot be empty"})
	}

	re := regexp.MustCompile(`@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_]+)`)
	matches := re.FindAllStringSubmatch(req.Content, -1)

	var mentionedUsers []models.User
	for _, match := range matches {
		if len(match) > 1 {
			target := match[1]
			var user models.User
			if err := db.DB.Where("email = ? OR name = ?", target, target).First(&user).Error; err == nil {
				mentionedUsers = append(mentionedUsers, user)
			}
		}
	}

	comment := models.Comment{
		PageID:   uint(pageID),
		UserID:   userID,
		Content:  req.Content,
		Mentions: mentionedUsers,
	}

	if err := db.DB.Create(&comment).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create comment"})
	}

	db.DB.Preload("User").Preload("Mentions").First(&comment, comment.ID)
	return c.Status(201).JSON(comment)
}
