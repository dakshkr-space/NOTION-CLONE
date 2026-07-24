package db

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/dakshkr-space/NOTION-CLONE/internal/models"
)

var DB *gorm.DB //global variable of type *gormDB(pointer to GORM database)-...db.DB

func Connect() { //function to initialise connection

	dsn := os.Getenv("DATABASE_URL") //DATABSE_URL in env file

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	//Creates Dialector-Interface for communication between GORM and postgresql

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	database.AutoMigrate(
		&models.User{},
		&models.Page{},
		&models.Team{},
		&models.PageVersion{},
		&models.Comment{},
	)
	//Automigrate goes through each struct in user.go, models.go and team.go, modifies if anything needed,(adding missing columns)

	DB = database

	log.Println("Database connected successfully")
}
