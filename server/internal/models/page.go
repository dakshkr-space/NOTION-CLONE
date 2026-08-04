package models

import "time"

type Page struct {
	ID       uint  `gorm:"primaryKey" json:"id"`
	UserID   uint  `gorm:"not null" json:"user_id"`
	ParentID *uint `json:"parent_id"`

	// TeamID: if set, this page belongs to a team (shared/nested page)
	// nil, personal page only the owner-(UserID) can see
	TeamID *uint `json:"team_id"`

	Title      string  `gorm:"not null" json:"title"`
	Content    string  `gorm:"type:text" json:"content"`
	ShareToken *string `gorm:"unique" json:"share_token"`
	OrderIndex int     `gorm:"default:0" json:"order_index"` //dragdrop

	ShareRole string    `gorm:"default:'viewer'" json:"share_role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
