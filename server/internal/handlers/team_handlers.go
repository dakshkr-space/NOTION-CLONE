package handlers

import (
    "github.com/gofiber/fiber/v2"

    "github.com/dakshkr-space/NOTION-CLONE/internal/db"
    "github.com/dakshkr-space/NOTION-CLONE/internal/models"
)

// CREATE TEAM 

// CreateTeam: any logged-in user can create a team.
// The creator automatically becomes that team's "team_head".
func CreateTeam(c *fiber.Ctx) error {

    userID := uint(c.Locals("userID").(float64))

    var body struct {
        Name string `json:"name"`
    }

    if err := c.BodyParser(&body); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
    }

    if body.Name == "" {
        return c.Status(400).JSON(fiber.Map{"error": "Team name is required"})
    }

    // Step 1: create the team, marking this user as the head
    team := models.Team{
        Name:       body.Name,
        HeadUserID: userID,
    }

    if err := db.DB.Create(&team).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Failed to create team"})
    }


    if err := db.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
        "team_id": team.ID,
        "role":    "team_head",
    }).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Team created, but failed to update your role"})
    }

    return c.Status(201).JSON(fiber.Map{
        "team":    team,
        "message": "Team created. You are now team_head. Please log in again to refresh your token.",
    })
}

// ADD MEMBER 

// AddTeamMember: team_head adds an existing user (by email) to their team.
// Admins can add anyone to any team.
func AddTeamMember(c *fiber.Ctx) error {

    requesterID := uint(c.Locals("userID").(float64))
    requesterRole := c.Locals("role").(string)
    requesterTeamID := uint(c.Locals("teamID").(float64))

    var body struct {
        Email  string `json:"email"`
        TeamID *uint  `json:"team_id"` // only used if requester is admin
    }

    if err := c.BodyParser(&body); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
    }

    if body.Email == "" {
        return c.Status(400).JSON(fiber.Map{"error": "Email is required"})
    }

    // Determine which team we're adding to
    var targetTeamID uint

    if requesterRole == "admin" {
        // Admin must specify which team in the request body
        if body.TeamID == nil {
            return c.Status(400).JSON(fiber.Map{"error": "team_id is required for admin"})
        }
        targetTeamID = *body.TeamID
    } else if requesterRole == "team_head" {
        // team_head can only add to their OWN team
        targetTeamID = requesterTeamID
    } else {
        // "user" and "viewer" can't add team members at all
        return c.Status(403).JSON(fiber.Map{"error": "Only team_head or admin can add members"})
    }

    // Find the user being added by email
    var targetUser models.User
    if err := db.DB.Where("email = ?", body.Email).First(&targetUser).Error; err != nil {
        return c.Status(404).JSON(fiber.Map{"error": "User with that email not found"})
    }

    // Update that user's team_id
    // If their role is still default "user", upgrade them to "viewer" by default
    // (team_head can later promote them further if needed — but that requires admin)
    updates := map[string]interface{}{
        "team_id": targetTeamID,
    }
    if targetUser.Role == "user" {
        updates["role"] = "viewer"
    }

    if err := db.DB.Model(&targetUser).Updates(updates).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Failed to add member"})
    }

    _ = requesterID // requesterID isn't used further but kept for clarity/future logging

    return c.JSON(fiber.Map{"message": "Member added to team", "user": targetUser})
}

//REMOVE MEMBER 

// RemoveTeamMember: team_head removes a user from their team (sets team_id to nil).
// Admins can remove anyone from any team
func RemoveTeamMember(c *fiber.Ctx) error {

    requesterRole := c.Locals("role").(string)
    requesterTeamID := uint(c.Locals("teamID").(float64))

    targetUserIDParam := c.Params("userId")

    var targetUser models.User
    if err := db.DB.First(&targetUser, targetUserIDParam).Error; err != nil {
        return c.Status(404).JSON(fiber.Map{"error": "User not found"})
    }

    // Permission check
    if requesterRole == "admin" {
        // admin can remove anyone — no extra check needed
    } else if requesterRole == "team_head" {
        // team_head can only remove members of THEIR OWN team
        if targetUser.TeamID == nil || *targetUser.TeamID != requesterTeamID {
            return c.Status(403).JSON(fiber.Map{"error": "You can only remove members of your own team"})
        }
    } else {
        return c.Status(403).JSON(fiber.Map{"error": "Only team_head or admin can remove members"})
    }

    // Remove from team: set team_id to NULL, downgrade role back to "user" if they were "viewer"
    updates := map[string]interface{}{
        "team_id": nil,
    }
    if targetUser.Role == "viewer" {
        updates["role"] = "user"
    }

    if err := db.DB.Model(&targetUser).Updates(updates).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Failed to remove member"})
    }

    return c.JSON(fiber.Map{"message": "Member removed from team"})
}

// PROMOTE / CHANGE ROLE (admin only)

// PromoteUser: admin changes any user's role directly.
func PromoteUser(c *fiber.Ctx) error {

    targetUserIDParam := c.Params("userId")

    var body struct {
        Role string `json:"role"`
    }

    if err := c.BodyParser(&body); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
    }

    // Validate role is one of our 4 allowed values
    validRoles := map[string]bool{
        "admin": true, "team_head": true, "user": true, "viewer": true,
    }
    if !validRoles[body.Role] {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid role. Must be admin, team_head, user, or viewer"})
    }

    var targetUser models.User
    if err := db.DB.First(&targetUser, targetUserIDParam).Error; err != nil {
        return c.Status(404).JSON(fiber.Map{"error": "User not found"})
    }

    if err := db.DB.Model(&targetUser).Update("role", body.Role).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Failed to update role"})
    }

    return c.JSON(fiber.Map{"message": "Role updated", "user": targetUser})
}