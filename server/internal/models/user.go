package models

import "time"

type User struct {
    ID       uint      `gorm:"primaryKey" json:"id"`
    Email    string    `gorm:"unique;not null" json:"email"`
    Name     string    `json:"name"`
    Password *string   `gorm:"->;column:password_hash" json:"-"`
    OAuthProvider string `json:"oauth_provider"`
    OAuthID  string    `gorm:"column:oauth_id" json:"-"`
    CreatedAt time.Time `json:"created_at"`
}