package routes

import (
	"github.com/dakshkr-space/NOTION-CLONE/internal/handlers"
	"github.com/dakshkr-space/NOTION-CLONE/internal/middleware"
	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {

	auth := app.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)
	auth.Get("/google", handlers.GoogleLogin)
	auth.Get("/google/callback", handlers.GoogleCallback)

	pages := app.Group("/pages", middleware.Protected)
	pages.Post("/", handlers.CreatePage)
	pages.Get("/", handlers.GetPages)
	pages.Get("/:id", handlers.GetPage)
	pages.Put("/:id", handlers.UpdatePage)
	pages.Delete("/:id", handlers.DeletePage)



	teams := app.Group("/teams", middleware.Protected)
    teams.Post("/", handlers.CreateTeam)
    teams.Post("/members", middleware.RequireRole("team_head", "admin"), handlers.AddTeamMember)
    teams.Delete("/members/:userId", middleware.RequireRole("team_head", "admin"), handlers.RemoveTeamMember)
    teams.Put("/promote/:userId", middleware.RequireRole("admin"), handlers.PromoteUser)
}
