package models

import (
	"time"

	"gorm.io/gorm"
)

type PageVersion struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	PageID      uint           `gorm:"not null;index" json:"page_id"`
	Title       string         `gorm:"not null" json:"title"`
	Content     string         `gorm:"type:text" json:"content"`
	CreatedByID uint           `gorm:"not null" json:"created_by_id"`
	CreatedBy   User           `gorm:"foreignKey:CreatedByID" json:"created_by"`
	CreatedAt   time.Time      `json:"created_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type Comment struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	PageID    uint           `gorm:"not null;index" json:"page_id"`
	UserID    uint           `gorm:"not null" json:"user_id"`
	User      User           `gorm:"foreignKey:UserID" json:"user"`
	Content   string         `gorm:"type:text;not null" json:"content"`
	Mentions  []User         `gorm:"many2many:comment_mentions;" json:"mentions"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}