package routes

import (
    "github.com/gofiber/fiber/v2"
    "github.com/dakshkr-space/NOTION-CLONE/internal/handlers"
    "github.com/dakshkr-space/NOTION-CLONE/internal/middleware"
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
}