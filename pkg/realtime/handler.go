package realtime

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for now (configure properly for production)
		return true
	},
}

// HandleWebSocket upgrades HTTP connections to WebSocket
func HandleWebSocket(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract user ID from JWT token (if authenticated)
		userID, exists := c.Get("user_id")
		userIDStr := ""
		if exists {
			userIDStr = userID.(string)
		}

		// Upgrade connection to WebSocket
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}

		// Create new client
		client := &Client{
			ID:     uuid.New().String(),
			UserID: userIDStr,
			Conn:   conn,
			Send:   make(chan []byte, 256),
			Hub:    hub,
		}

		// Register client
		hub.register <- client

		// Start client pump goroutines
		go client.WritePump()
		go client.ReadPump()
	}
}
