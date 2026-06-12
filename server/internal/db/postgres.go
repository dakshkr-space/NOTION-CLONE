package db

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/dakshkr-space/NOTION-CLONE/internal/models"
)

var DB *gorm.DB

func Connect() {

	dsn := os.Getenv("DATABASE_URL")

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	database.AutoMigrate(&models.User{}, &models.Page{})

	DB = database

	log.Println("Database connected successfully")
}
