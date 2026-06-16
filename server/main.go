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
//env file -run before db.Connect() and for any os.Getenv() calls
	 if err := godotenv.Load(); err != nil {
        log.Println("No .env file found, using system environment variables")
    }

	db.Connect()

	app := fiber.New() //fiber application-hhtp serverinstance

	app.Use(cors.New(cors.Config{ //cors global middleware
		AllowOrigins: "*",     //allow request from any port(frontend port.  different(local host:3000,loalhost:5500))
		AllowHeaders: "Origin, Content-Type, Authorization", 
	}))
	routes.Setup(app) //routes connection 
	log.Fatal(app.Listen(":3000"))
}
