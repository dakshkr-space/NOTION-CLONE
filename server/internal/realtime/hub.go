package realtime

import (
	"sync"
	"time"

	"github.com/gofiber/websocket/v2"
)

type PageUpdate struct {
	Type      string    `json:"type"`
	PageID    uint      `json:"page_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	UpdatedAt time.Time `json:"updated_at"`
}

type subscriber struct {
	conn    *websocket.Conn
	writeMu sync.Mutex
}

type Hub struct {
	mu    sync.RWMutex
	pages map[uint]map[*subscriber]struct{}
}

func NewHub() *Hub {
	return &Hub{pages: make(map[uint]map[*subscriber]struct{})}
}

var DefaultHub = NewHub()

func (h *Hub) Subscribe(pageID uint, conn *websocket.Conn) (*subscriber, func()) {
	client := &subscriber{conn: conn}
	h.mu.Lock()
	if h.pages[pageID] == nil {
		h.pages[pageID] = make(map[*subscriber]struct{})
	}
	h.pages[pageID][client] = struct{}{}
	h.mu.Unlock()

	return client, func() { h.remove(pageID, client) }
}

func (h *Hub) BroadcastPageUpdate(pageID uint, title, content string) {
	h.broadcast(pageID, PageUpdate{
		Type:      "page_updated",
		PageID:    pageID,
		Title:     title,
		Content:   content,
		UpdatedAt: time.Now().UTC(),
	})
}

func (h *Hub) SendSnapshot(client *subscriber, pageID uint, title, content string, updatedAt time.Time) error {
	return client.send(PageUpdate{
		Type:      "page_snapshot",
		PageID:    pageID,
		Title:     title,
		Content:   content,
		UpdatedAt: updatedAt,
	})
}

func (h *Hub) broadcast(pageID uint, update PageUpdate) {
	h.mu.RLock()
	clients := make([]*subscriber, 0, len(h.pages[pageID]))
	for client := range h.pages[pageID] {
		clients = append(clients, client)
	}
	h.mu.RUnlock()

	for _, client := range clients {
		if err := client.send(update); err != nil {
			h.remove(pageID, client)
		}
	}
}

func (h *Hub) remove(pageID uint, client *subscriber) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if clients := h.pages[pageID]; clients != nil {
		delete(clients, client)
		if len(clients) == 0 {
			delete(h.pages, pageID)
		}
	}
}

func (client *subscriber) send(update PageUpdate) error {
	client.writeMu.Lock()
	defer client.writeMu.Unlock()
	return client.conn.WriteJSON(update)
}
