package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
)

type GrokMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type GrokRequest struct {
	Model    string        `json:"model"`
	Messages []GrokMessage `json:"messages"`
	Stream   bool          `json:"stream"`
}

type GrokResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func AskAI(c *fiber.Ctx) error {

	var body struct {
		Prompt      string `json:"prompt"`
		PageContent string `json:"page_content"`
		PageTitle   string `json:"page_title"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	if body.Prompt == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Prompt is required"})
	}

	// Build system message with page context
	systemMsg := "You are an AI assistant inside a Notion-style note-taking app. Help users summarize notes, generate meeting notes, improve writing, and answer questions about their workspace content. Be concise and helpful."

	// Build user message with page context if available
	userMsg := body.Prompt
	if body.PageContent != "" {
		userMsg = fmt.Sprintf("I have this page open:\nTitle: %s\nContent: %s\n\nMy question: %s",
			body.PageTitle,
			body.PageContent,
			body.Prompt,
		)
	}

	grokReq := GrokRequest{
		Model:  "llama-3.3-70b-versatile",
		Stream: false,
		Messages: []GrokMessage{
			{Role: "system", Content: systemMsg},
			{Role: "user", Content: userMsg},
		},
	}

	reqBody, err := json.Marshal(grokReq)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to build request"})
	}

	// Call Grok API
	req, err := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create request"})
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+os.Getenv("GROQ_API_KEY"))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to reach Grok API"})
	}
	defer resp.Body.Close()

	var grokResp GrokResponse
	if err := json.NewDecoder(resp.Body).Decode(&grokResp); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to parse response"})
	}
	if len(grokResp.Choices) == 0 {
		return c.Status(500).JSON(fiber.Map{"error": "No response from Grok"})
	}

	return c.JSON(fiber.Map{"response": grokResp.Choices[0].Message.Content})
}
