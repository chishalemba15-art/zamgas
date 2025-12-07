package realtime

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// EventType represents the type of database event
type EventType string

const (
	EventOrderCreated   EventType = "order:created"
	EventOrderUpdated   EventType = "order:updated"
	EventOrderAccepted  EventType = "order:accepted"
	EventOrderRejected  EventType = "order:rejected"
	EventOrderDelivered EventType = "order:delivered"
	EventLocationUpdate EventType = "location:updated"
	EventPaymentUpdate  EventType = "payment:updated"
	EventUserUpdate     EventType = "user:updated"
)

// Event represents a real-time event
type Event struct {
	Type    EventType   `json:"type"`
	Payload interface{} `json:"payload"`
	UserID  string      `json:"user_id,omitempty"`  // For user-specific events
	OrderID string      `json:"order_id,omitempty"` // For order-specific events
}

// Client represents a WebSocket client
type Client struct {
	ID     string
	UserID string
	Conn   *websocket.Conn
	Send   chan []byte
	Hub    *Hub
}

// Hub maintains active WebSocket connections and broadcasts events
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Inbound messages from clients
	broadcast chan Event

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for thread-safe operations
	mu sync.RWMutex
}

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan Event, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("🔌 Client connected: %s (User: %s)", client.ID, client.UserID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
				log.Printf("🔌 Client disconnected: %s", client.ID)
			}
			h.mu.Unlock()

		case event := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				// Filter events based on user ID
				if h.shouldSendToClient(client, event) {
					message, err := json.Marshal(event)
					if err != nil {
						log.Printf("Error marshaling event: %v", err)
						continue
					}

					select {
					case client.Send <- message:
					default:
						close(client.Send)
						delete(h.clients, client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// shouldSendToClient determines if an event should be sent to a specific client
func (h *Hub) shouldSendToClient(client *Client, event Event) bool {
	// Send all location updates to everyone (for live tracking)
	if event.Type == EventLocationUpdate {
		return true
	}

	// Send user-specific events only to that user
	if event.UserID != "" && client.UserID != "" {
		return event.UserID == client.UserID
	}

	// Send order events to involved users
	if event.OrderID != "" {
		// This could be enhanced to check if the user is involved in the order
		return true
	}

	// By default, send all events
	return true
}

// Broadcast sends an event to all connected clients
func (h *Hub) Broadcast(event Event) {
	h.broadcast <- event
}

// BroadcastOrderCreated broadcasts an order creation event
func (h *Hub) BroadcastOrderCreated(orderID string, userID string, payload interface{}) {
	h.Broadcast(Event{
		Type:    EventOrderCreated,
		OrderID: orderID,
		UserID:  userID,
		Payload: payload,
	})
}

// BroadcastOrderUpdated broadcasts an order update event
func (h *Hub) BroadcastOrderUpdated(orderID string, userID string, payload interface{}) {
	h.Broadcast(Event{
		Type:    EventOrderUpdated,
		OrderID: orderID,
		UserID:  userID,
		Payload: payload,
	})
}

// BroadcastLocationUpdate broadcasts a location update event
func (h *Hub) BroadcastLocationUpdate(courierID string, orderID string, payload interface{}) {
	h.Broadcast(Event{
		Type:    EventLocationUpdate,
		OrderID: orderID,
		UserID:  courierID,
		Payload: payload,
	})
}

// BroadcastPaymentUpdate broadcasts a payment update event
func (h *Hub) BroadcastPaymentUpdate(orderID string, userID string, payload interface{}) {
	h.Broadcast(Event{
		Type:    EventPaymentUpdate,
		OrderID: orderID,
		UserID:  userID,
		Payload: payload,
	})
}

// ReadPump reads messages from the WebSocket connection
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	for {
		_, _, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
	}
}

// WritePump writes messages to the WebSocket connection
func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()

	for message := range c.Send {
		err := c.Conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Printf("WebSocket write error: %v", err)
			return
		}
	}
}
