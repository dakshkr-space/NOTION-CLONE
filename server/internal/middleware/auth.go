package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func Protected(c *fiber.Ctx) error {

	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Missing authorization header"})
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

	token, err := jwt.ParseWithClaims(tokenStr, &jwt.MapClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid or expired token"})
	}

	claims := token.Claims.(*jwt.MapClaims)
	c.Locals("userID", (*claims)["user_id"])

	return c.Next()
}
