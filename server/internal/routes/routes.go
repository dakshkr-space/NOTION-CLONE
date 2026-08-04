package routes

import (
	"github.com/dakshkr-space/NOTION-CLONE/internal/handlers"
	"github.com/dakshkr-space/NOTION-CLONE/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

func Setup(app *fiber.App) {

	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	app.Get("/ws/shared/:token", websocket.New(handlers.SharedPageWebSocket))

	auth := app.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)
	auth.Get("/google", handlers.GoogleLogin)
	auth.Get("/google/callback", handlers.GoogleCallback)
	app.Get("/auth/me", middleware.Protected, handlers.Me)
	app.Post("/auth/logout", handlers.Logout)
	// PUBLIC shared page route - no auth needed
	app.Get("/shared/:token", handlers.GetSharedPage)
	app.Put("/shared/:token", handlers.UpdateSharedPage) // NEW LINE — no Protected middleware, it's public
	app.Get("/ws/pages/:id", websocket.New(handlers.PageWebSocket))
	// AI endpoint
	app.Post("/ai/ask", middleware.Protected, handlers.AskAI)
	// Version History routes
	app.Get("/pages/:id/versions", middleware.Protected, handlers.GetPageVersions)
	app.Post("/pages/:id/versions/:versionId/restore", middleware.Protected, handlers.RestorePageVersion)
	// Comment & Mention routes
	app.Get("/pages/:id/comments", middleware.Protected, handlers.GetComments)
	app.Post("/pages/:id/comments", middleware.Protected, handlers.AddComment)

	pages := app.Group("/pages", middleware.Protected)
	pages.Put("/reorder", handlers.ReorderPages)
	pages.Post("/", handlers.CreatePage)
	pages.Get("/", handlers.GetPages)
	pages.Get("/:id", handlers.GetPage)
	pages.Put("/:id", handlers.UpdatePage)
	pages.Delete("/:id", handlers.DeletePage)
	pages.Get("/:id/children", handlers.GetChildPages)
	pages.Post("/:id/share", handlers.SharePage)

	teams := app.Group("/teams", middleware.Protected)
	teams.Post("/", handlers.CreateTeam)
	teams.Post("/members", middleware.RequireRole("team_head", "admin"), handlers.AddTeamMember)
	teams.Delete("/members/:userId", middleware.RequireRole("team_head", "admin"), handlers.RemoveTeamMember)
	teams.Put("/promote/:userId", middleware.RequireRole("admin"), handlers.PromoteUser)
}
