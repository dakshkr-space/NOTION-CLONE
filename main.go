package main

func main() {

	// User
	type User struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	OAuthProvider string    `json:"oauth_provider"`
	CreatedAt     time.Time `json:"created_at"`
}

   //Pages
  type Page struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	ParentID  *string   `json:"parent_id"` // nil = root page
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
}
