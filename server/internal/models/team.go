package models

import "time"

// HeadUserID (team-head)
type Team struct {
    ID         uint      `gorm:"primaryKey" json:"id"`
    Name       string    `gorm:"not null" json:"name"`
    HeadUserID uint       `json:"head_user_id"`
    CreatedAt  time.Time `json:"created_at"`
}