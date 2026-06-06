package db

import (
	"database/sql"
	"log"

)

func Connect() *sql.DB {
	db, err := sql.Open("postgres", "postgres://user:password@localhost:5432/notion?sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	return db
}
