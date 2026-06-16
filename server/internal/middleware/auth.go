package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func Protected(c *fiber.Ctx) error {   //default middle ware function for fiber   

	authHeader := c.Get("Authorization")    //reads authorization http header, if empty return..
	if authHeader == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Missing authorization header"}) //401 unauthorised
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ") //strips bearer prefix to give raw jwt token, if exists

	token, err := jwt.ParseWithClaims(tokenStr, &jwt.MapClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	}) //jwt verification

	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid or expired token"})
	}

	// token.Claims is *jwt.MapClaims (pointer), because  &jwt.MapClaims{}was passed above
	claims, ok := token.Claims.(*jwt.MapClaims)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token claims"})
	}

	// claims is a pointer, so dereference 
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
