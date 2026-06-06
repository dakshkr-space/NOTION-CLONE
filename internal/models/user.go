package models

import "time"

type User struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	OAuthProvider string    `json:"oauth_provider"`
	CreatedAt     time.Time `json:"created_at"`
}
