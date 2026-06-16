package models

import "time"

type User struct {
	ID            uint    `gorm:"primaryKey" json:"id"`
	Email         string  `gorm:"unique;not null" json:"email"`
	Name          string  `json:"name"`
	Password      *string `gorm:"column:password_hash" json:"-"`   //NOT to show in JSON output 
	OAuthProvider string  `json:"oauth_provider"`
	OAuthID       string  `gorm:"column:oauth_id" json:"-"`        //NOT to show in JSON output

	// Roles: "admin", "team_head", "user", or "viewer"
	// Default value "user"
	Role string `gorm:"default:'user'" json:"role"`

	// TeamID: ID of team user belongs to
	//    *uint(allow nil)    nil = no team, nil proved for better use case in further function

	TeamID *uint `json:"team_id"`

	CreatedAt time.Time `json:"created_at"`
}
