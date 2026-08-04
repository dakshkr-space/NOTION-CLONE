package middleware

import (
	"errors"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func Protected(c *fiber.Ctx) error {
	tokenStr := c.Cookies("token")
	if tokenStr == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Not authenticated"})
	}

	token, err := jwt.ParseWithClaims(tokenStr, &jwt.MapClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid or expired token"})
	}

	claims, ok := token.Claims.(*jwt.MapClaims)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token claims"})
	}

	c.Locals("userID", (*claims)["user_id"])
	c.Locals("role", (*claims)["role"])
	c.Locals("teamID", (*claims)["team_id"])

	return c.Next()
}

// RequireRole is a middleware
// Usage: middleware.RequireRole("admin", "team_head")
// Returns a middleware function that only lets through users with one of the listed roles.
func RequireRole(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok {
			return c.Status(403).JSON(fiber.Map{"error": "Role not found in token"})
		}

		for _, allowed := range allowedRoles {
			if role == allowed {
				return c.Next()
			}
		}

		return c.Status(403).JSON(fiber.Map{"error": "Insufficient permissions"})
	}
}

// ParseUserID verifies a JWT string directly (not via a Fiber request) and
// returns the user_id claim. Used by WebSocket routes, which can't rely on
// the normal Protected middleware because browsers can't set custom headers
// on a WebSocket connection.
func ParseUserID(tokenStr string) (uint, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &jwt.MapClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {
		return 0, errors.New("invalid or expired token")
	}
	claims, ok := token.Claims.(*jwt.MapClaims)
	if !ok {
		return 0, errors.New("invalid token claims")
	}
	idFloat, ok := (*claims)["user_id"].(float64)
	if !ok {
		return 0, errors.New("invalid user_id claim")
	}
	return uint(idFloat), nil
}
