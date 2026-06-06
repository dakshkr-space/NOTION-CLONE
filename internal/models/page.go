package models

import "time"

type Page struct {
	ID        string     `json:"id"`
	UserID    string     `json:"user_id"`
	ParentID  *string    `json:"parent_id"`
	Title     string     `json:"title"`
	Content   string     `json:"content"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}
