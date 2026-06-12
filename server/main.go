package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

	"github.com/dakshkr-space/NOTION-CLONE/internal/db"
	"github.com/dakshkr-space/NOTION-CLONE/internal/routes"
)

func main() {
//env file -run before db.Connect() and before any os.Getenv() calls
	 if err := godotenv.Load(); err != nil {
        log.Println("No .env file found, using system environment variables")
    }

	db.Connect()

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Authorization",
	}))
	routes.Setup(app)
	log.Fatal(app.Listen(":3000"))
}
