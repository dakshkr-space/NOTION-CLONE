package models

import "time"

type Page struct {
    ID       uint   `gorm:"primaryKey" json:"id"`
    UserID   uint   `gorm:"not null" json:"user_id"`
    ParentID *uint  `json:"parent_id"`
    Title    string `gorm:"not null" json:"title"`
    Content  string `gorm:"type:text" json:"content"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}