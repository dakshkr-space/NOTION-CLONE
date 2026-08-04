package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"regexp"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"github.com/dakshkr-space/NOTION-CLONE/internal/db"
	"github.com/dakshkr-space/NOTION-CLONE/internal/models"
)

func getGoogleOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("BACKEND_URL") + "/auth/google/callback",
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

func Register(c *fiber.Ctx) error {

	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if body.Email == "" || body.Password == "" || body.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name, email and password are required"})
	}

	emailRegex := regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	if !emailRegex.MatchString(body.Email) {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid email format"})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to hash password"})
	}

	hashStr := string(hashedPassword)
	user := models.User{
		Name:          body.Name,
		Email:         body.Email,
		Password:      &hashStr,
		OAuthProvider: "email",
	}

	if err := db.DB.Create(&user).Error; err != nil {

		return c.Status(409).JSON(fiber.Map{"error": "Email already registered"})
	}

	token, err := generateToken(user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	setAuthCookie(c, token)
	return c.Status(201).JSON(fiber.Map{"user": user})
}

func Login(c *fiber.Ctx) error {

	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	//Following user enamuration
	var user models.User
	if err := db.DB.Where("email = ?", body.Email).First(&user).Error; err != nil {

		return c.Status(401).JSON(fiber.Map{"error": "Invalid email or password"})
	}

	if user.Password == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Please login with Google"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.Password), []byte(body.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid email or password"})
	}

	token, err := generateToken(user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
	}
	setAuthCookie(c, token)

	return c.JSON(fiber.Map{"user": user})
}

func GoogleLogin(c *fiber.Ctx) error {

	url := getGoogleOAuthConfig().AuthCodeURL("random-state-string", oauth2.AccessTypeOffline)

	return c.Redirect(url)
}

func GoogleCallback(c *fiber.Ctx) error {

	code := c.Query("code")
	if code == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Missing code from Google"})
	}

	oauthToken, err := getGoogleOAuthConfig().Exchange(context.Background(), code)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to exchange token"})
	}

	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + oauthToken.AccessToken)
	if err != nil || resp.StatusCode != 200 {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get user info from Google"})
	}
	defer resp.Body.Close()

	var googleUser struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to parse Google user info"})
	}

	var user models.User
	result := db.DB.Where("oauth_id = ?", googleUser.ID).First(&user)

	if result.Error != nil {

		user = models.User{
			Name:          googleUser.Name,
			Email:         googleUser.Email,
			OAuthProvider: "google",
			OAuthID:       googleUser.ID,
		}
		if err := db.DB.Create(&user).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create user"})
		}
	}

	token, err := generateToken(user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
	}
	setAuthCookie(c, token)

	return c.Redirect(os.Getenv("FRONTEND_URL") + "/dashboard") //hide token from frontend
}

// generateToken now takes the FULL user struct (not just ID)
// because we need access to user.Role and user.TeamID too
func generateToken(user models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
	}

	// user.TeamID is *uint (a pointer) — it can be nil if user has no team
	// JWT claims work best with concrete values, so:
	// - if TeamID is set, dereference it (*user.TeamID) to get the actual number
	// - if nil, store 0 to represent "no team"
	if user.TeamID != nil {
		claims["team_id"] = *user.TeamID
	} else {
		claims["team_id"] = 0
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func setAuthCookie(c *fiber.Ctx, token string) {
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    token,
		HTTPOnly: true,                             // JS cannot read this — the whole point
		Secure:   os.Getenv("ENV") == "production", // only sent over HTTPS in prod
		SameSite: "Lax",                            // blocks most CSRF, still works for normal navigation
		Path:     "/",
		MaxAge:   7 * 24 * 60 * 60, // 7 days, matches your JWT exp
	})
}

func Me(c *fiber.Ctx) error {
	userID := uint(c.Locals("userID").(float64))
	var user models.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}
	return c.JSON(user)
}

func Logout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    "",
		HTTPOnly: true,
		Path:     "/",
		MaxAge:   -1, // deletes the cookie immediately
	})
	return c.JSON(fiber.Map{"message": "Logged out"})
}
