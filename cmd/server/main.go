package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
	"github.com/yakumwamba/lpg-delivery-system/internal/admin"
	"github.com/yakumwamba/lpg-delivery-system/internal/auth"
	"github.com/yakumwamba/lpg-delivery-system/internal/inventory"
	"github.com/yakumwamba/lpg-delivery-system/internal/location"
	"github.com/yakumwamba/lpg-delivery-system/internal/order"
	"github.com/yakumwamba/lpg-delivery-system/internal/pawapay"
	"github.com/yakumwamba/lpg-delivery-system/internal/payment"
	"github.com/yakumwamba/lpg-delivery-system/internal/preferences"
	"github.com/yakumwamba/lpg-delivery-system/internal/provider"
	"github.com/yakumwamba/lpg-delivery-system/internal/user"
	"github.com/yakumwamba/lpg-delivery-system/pkg/database"
	"github.com/yakumwamba/lpg-delivery-system/pkg/middleware"
	"github.com/yakumwamba/lpg-delivery-system/pkg/realtime"
	"golang.org/x/oauth2"
)

func main() {
	// Load .env file from project root
	envPath := filepath.Join(".", ".env")
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("⚠️  Warning: Could not load .env file from %s: %v\n", envPath, err)
		log.Println("Attempting to use environment variables directly...")
	}

	// Get port from environment variable
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Get JWT secret from environment variable
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "21i3u1oi23b23423423423sdfsasdnajsbkjbfkjbsdkjbfskjbfkjsdbfbksdf"
	}

	// Connect to Neon PostgreSQL database
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("❌ DATABASE_URL environment variable is required for Neon connection")
	}

	log.Println("🔗 Connecting to Neon PostgreSQL database...")
	pool, err := database.ConnectPostgres(databaseURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to Neon database: %v", err)
	}
	defer pool.Close()

	log.Println("✅ Successfully connected to Neon database!")

	// Initialize database schema
	if err := database.InitPostgresSchema(pool); err != nil {
		log.Fatalf("❌ Failed to initialize database schema: %v", err)
	}

	// Get standard database connection from pool for services
	db := database.GetStdDB(pool)

	// Initialize WebSocket hub for real-time updates
	hub := realtime.NewHub()
	go hub.Run()
	log.Println("✅ WebSocket hub initialized for real-time updates")

	// Initialize PawaPay client with environment variables
	pawaPayURL := os.Getenv("PAWAPAY_API_URL")
	if pawaPayURL == "" {
		pawaPayURL = "https://api.sandbox.pawapay.io/"
	}
	pawaPayToken := os.Getenv("PAWAPAY_API_TOKEN")
	if pawaPayToken == "" {
		pawaPayToken = "eyJraWQiOiIxIiwiYWxnIjoiRVMyNTYifQ.eyJ0dCI6IkFBVCIsInN1YiI6IjEzMzU1IiwibWF2IjoiMSIsImV4cCI6MjA4MDU5Nzc2OCwiaWF0IjoxNzY1MDY0OTY4LCJwbSI6IkRBRixQQUYiLCJqdGkiOiI5ZmEwYjhlNi03M2E4LTQ0MTItYjA5MS1kY2NkNjhlYjU3MzYifQ.3SnYpNZ2EkhsbBAvX3HEgNb-yym5NzGOLtb2HGMQp16ofPZrNjB84BwgrG7DVWYFmAfAlXZ8KL-2BG6BVYj-Zg"
	}
	pawaPayCallbackURL := os.Getenv("PAWAPAY_CALLBACK_URL")
	if pawaPayCallbackURL == "" {
		pawaPayCallbackURL = "http://localhost:8080/payments/callback" // Fallback for local development
	}

	log.Printf("✅ PawaPay Configuration: URL=%s, CallbackURL=%s", pawaPayURL, pawaPayCallbackURL)

	pawaPayClient := pawapay.NewClient(
		pawaPayURL,
		pawaPayToken,
		pawaPayToken,
		pawaPayCallbackURL,
	)

	// Initialize Twilio client with environment variables
	twilioAccountSID := os.Getenv("TWILIO_ACCOUNT_SID")
	twilioAuthToken := os.Getenv("TWILIO_AUTH_TOKEN")
	twilioPhoneNumber := os.Getenv("TWILIO_PHONE_NUMBER")

	if twilioAccountSID == "" || twilioAuthToken == "" || twilioPhoneNumber == "" {
		log.Fatalf("Twilio configuration is incomplete. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.")
	}

	twilioClient := auth.NewTwilioClient(twilioAccountSID, twilioAuthToken, twilioPhoneNumber)
	if twilioClient == nil {
		logrus.Fatal("Failed to initialize Twilio client")
	}

	// Initialize all services with SQLite
	log.Println("📊 Initializing services...")
	userService := user.NewService(db)
	orderService := order.NewService(db)
	paymentService := payment.NewService(db, orderService, userService, pawaPayClient)
	inventoryService := inventory.NewService(db)
	locationService := location.NewService(db)
	providerService := provider.NewService(db)
	preferencesService := preferences.NewService(db)

	authService := auth.NewService(db, userService, jwtSecret)

	// Initialize admin auth service (separate from regular user auth)
	adminAuthService := admin.NewAdminAuthService(db, jwtSecret)

	// Health check: Test database connectivity
	log.Println("🏥 Running database health check...")
	if err := db.Ping(); err != nil {
		log.Printf("⚠️  Warning: Database ping failed: %v\n", err)
		log.Println("   The server may still work, but database operations might fail")
	} else {
		log.Println("✅ Database health check passed")
	}
	// Set up Gin router
	router := gin.Default()
	// Add CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Database availability middleware - only applied to protected routes
	dbMiddleware := func(c *gin.Context) {
		if db == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "Database connection unavailable",
				"message": "The server is running without database access",
			})
			c.Abort()
			return
		}
		c.Next()
	}

	// WebSocket endpoint for real-time updates
	router.GET("/ws", realtime.HandleWebSocket(hub))

	// Auth routes
	router.POST("/auth/signup", dbMiddleware, handleSignUp(authService))
	router.POST("/auth/signin", dbMiddleware, handleSignIn(authService, db))
	router.GET("/auth/signout", handleSignOut(authService))
	router.POST("/auth/send-code", auth.HandleSendCode(userService, authService, twilioClient))
	router.POST("/auth/verify-phone", dbMiddleware, handleVerifyPhone(authService, userService))

	// Google OAuth routes
	router.GET("/auth/google", handleGoogleLogin())
	router.GET("/auth/google/callback", handleGoogleCallback(authService, userService))
	// router.POST("/auth/verXify-code", handleVerifyCode(userService, authService))

	// Admin auth routes (separate from regular user auth)
	router.POST("/admin/login", dbMiddleware, handleAdminLogin(adminAuthService))
	router.GET("/admin/me", adminAuthMiddleware(adminAuthService), dbMiddleware, handleGetAdminInfo(adminAuthService))

	// User routes
	userRoutes := router.Group("/user")
	userRoutes.Use(middleware.AuthMiddleware(authService), dbMiddleware)
	{
		userRoutes.GET("/profile", handleGetProfile(userService))
		userRoutes.PUT("/profile", handleUpdateProfile(userService))
		userRoutes.POST("/orders/create", middleware.UserTypeMiddleware(user.UserTypeCustomer), handleCreateOrder(orderService, inventoryService, db, hub))
		userRoutes.GET("/orders", middleware.UserTypeMiddleware(user.UserTypeCustomer), handleGetUserOrders(orderService))
		// Add this to your routes configuration
		// Add this to your routes configuration
		userRoutes.PUT("/orders/:id/payment-status", handleUpdateOrderPaymentStatus(orderService))
	}
	router.PUT("/user/location", middleware.AuthMiddleware(authService), handleUpdateUserLocation(userService))

	// Provider routes
	providerRoutes := router.Group("/provider")
	providerRoutes.Use(middleware.AuthMiddleware(authService), middleware.UserTypeMiddleware(user.UserTypeProvider), dbMiddleware)
	{
		providerRoutes.GET("/orders", handleGetProviderOrders(orderService))
		providerRoutes.PUT("/orders/:id/accept", handleAcceptOrder(orderService))
		providerRoutes.PUT("/orders/:id/reject", handleRejectOrder(orderService))
		providerRoutes.GET("/orders/:id", handleGetSingleOrder(orderService, userService))
		// providerRoutes.GET("/orders/:id/user", handleGetUserDetails(userService))
		// providerRoutes.GET("/best", handleGetBestProvider(userService, orderService))
		providerRoutes.POST("/inventory", handleAddInventoryItem(inventoryService))
		providerRoutes.PUT("/inventory/:id", handleUpdateInventoryItem(inventoryService))
		providerRoutes.GET("/inventory", handleGetProviderInventory(inventoryService))
		providerRoutes.PUT("/inventory/:id/stock", handleUpdateStock(inventoryService))

	}

	customerRoutes := router.Group("/customer")
	customerRoutes.Use(middleware.AuthMiddleware(authService), middleware.UserTypeMiddleware(user.UserTypeCustomer), dbMiddleware)
	{
		customerRoutes.POST("/best", handleGetBestProvider(userService, orderService))
		// customerRoutes.GET("/cylinder-pricing/:provider_id/:cylinder_type", handleGetPriceByProviderAndCylinderType(providerService))

		// User preferences endpoints
		customerRoutes.GET("/preferences", handleGetPreferences(preferencesService))
		customerRoutes.PUT("/preferences", handleUpsertPreferences(preferencesService))
		customerRoutes.PUT("/preferences/cylinder", handleUpdateCylinderPreference(preferencesService))
		// Provider preferences removed - use location-based matching instead
		// customerRoutes.PUT("/preferences/provider", handleUpdateProviderPreference(preferencesService))

		// Nearest provider with optional save
		customerRoutes.POST("/nearest-provider", handleGetNearestProvider(userService, preferencesService))
	}

	// Courier routess
	courierRoutes := router.Group("/courier")
	courierRoutes.Use(middleware.AuthMiddleware(authService), middleware.UserTypeMiddleware(user.UserTypeCourier), dbMiddleware)
	{
		courierRoutes.GET("/orders", handleGetCourierOrders(orderService))
		courierRoutes.PUT("/orders/:id/update-status", handleUpdateOrderStatus(orderService))
		courierRoutes.POST("/location", handleUpdateLocation(locationService))
		courierRoutes.PUT("/orders/:id/location", handleUpdateOrderLocation(orderService, locationService))
		courierRoutes.GET("/orders/:id", handleGetSingleOrder(orderService, userService))
		courierRoutes.PUT("/orders/:id/accept-assignment", handleAcceptAssignment(orderService))
		courierRoutes.PUT("/orders/:id/decline-assignment", handleDeclineAssignment(orderService))
		// courierRoutes.GET("/orders/:id/user", handleGetOrderUserDetails(orderService, userService))
		courierRoutes.GET("/users/:id", handleGetUserDetails(userService))
	}

	fmt.Printf("Registering payment routes...")
	// Payment routes
	paymentRoutes := router.Group("/payments")
	{
		// Create handler instance using the payment package
		handler := payment.NewHandler(paymentService)

		paymentRoutes.POST("/deposit", handler.InitiateDepositHandler())
		paymentRoutes.GET("/status/:depositId", handler.CheckDepositStatusHandler)
		paymentRoutes.POST("/callback", handler.DepositCallbackHandler())
	}

	// PawaPay Callback routes (webhooks from PawaPay)
	// These endpoints must be public (no auth) as they're called by PawaPay servers
	pawaPayCallbackHandler := pawapay.NewCallbackHandler(db)

	router.POST("/api/pawapay/callback/deposits", func(c *gin.Context) {
		logrus.Info("Received PawaPay deposit callback")

		body, err := c.GetRawData()
		if err != nil {
			logrus.WithError(err).Error("Failed to read callback body")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		logrus.WithField("payload", string(body)).Debug("Deposit callback payload")

		if err := pawaPayCallbackHandler.HandleDepositCallback(body); err != nil {
			logrus.WithError(err).Error("Failed to process deposit callback")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process callback"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "success"})
	})

	router.POST("/api/pawapay/callback/payouts", func(c *gin.Context) {
		logrus.Info("Received PawaPay payout callback")

		body, err := c.GetRawData()
		if err != nil {
			logrus.WithError(err).Error("Failed to read callback body")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		if err := pawaPayCallbackHandler.HandlePayoutCallback(body); err != nil {
			logrus.WithError(err).Error("Failed to process payout callback")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process callback"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "success"})
	})

	router.POST("/api/pawapay/callback/refunds", func(c *gin.Context) {
		logrus.Info("Received PawaPay refund callback")

		body, err := c.GetRawData()
		if err != nil {
			logrus.WithError(err).Error("Failed to read callback body")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		if err := pawaPayCallbackHandler.HandleRefundCallback(body); err != nil {
			logrus.WithError(err).Error("Failed to process refund callback")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process callback"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "success"})
	})

	// Also register routes WITHOUT /api prefix (PawaPay is configured to hit these)
	router.POST("/pawapay/callback/deposits", func(c *gin.Context) {
		logrus.Info("Received PawaPay deposit callback (no /api prefix)")

		body, err := c.GetRawData()
		if err != nil {
			logrus.WithError(err).Error("Failed to read callback body")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		logrus.WithField("payload", string(body)).Info("Deposit callback payload")

		if err := pawaPayCallbackHandler.HandleDepositCallback(body); err != nil {
			logrus.WithError(err).Error("Failed to process deposit callback")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process callback"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "success"})
	})

	router.POST("/pawapay/callback/payouts", func(c *gin.Context) {
		logrus.Info("Received PawaPay payout callback (no /api prefix)")

		body, err := c.GetRawData()
		if err != nil {
			logrus.WithError(err).Error("Failed to read callback body")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		if err := pawaPayCallbackHandler.HandlePayoutCallback(body); err != nil {
			logrus.WithError(err).Error("Failed to process payout callback")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process callback"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "success"})
	})

	router.POST("/pawapay/callback/refunds", func(c *gin.Context) {
		logrus.Info("Received PawaPay refund callback (no /api prefix)")

		body, err := c.GetRawData()
		if err != nil {
			logrus.WithError(err).Error("Failed to read callback body")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		if err := pawaPayCallbackHandler.HandleRefundCallback(body); err != nil {
			logrus.WithError(err).Error("Failed to process refund callback")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process callback"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "success"})
	})

	// Public routes
	router.GET("/providers", handleGetProviders(userService))
	router.GET("/orders/:id/track", handleTrackOrder(orderService))
	router.GET("/cylinder-pricing/:provider_id/:cylinder_type", handleGetPriceByProviderAndCylinderType(providerService))
	router.POST("/image", handleUploadProviderImage(providerService))
	router.GET("/providers/:provider_id/image", handleGetProviderImage(providerService))

	router.GET("/providers/:provider_id", handleGetProviderByIdCustomer(providerService))

	// Admin routes - Protected by admin authentication (separate from regular users)
	adminService := admin.NewService(db)
	adminRoutes := router.Group("/admin")
	adminRoutes.Use(adminAuthMiddleware(adminAuthService), dbMiddleware)
	{
		// Dashboard endpoints
		adminRoutes.GET("/dashboard/stats", func(c *gin.Context) {
			stats, err := adminService.GetDashboardStats()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, stats)
		})

		// Analytics endpoints
		adminRoutes.GET("/analytics/revenue", func(c *gin.Context) {
			daysStr := c.DefaultQuery("days", "7")
			days := 7
			if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
				days = d
			}
			analytics, err := adminService.GetRevenueAnalytics(days)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, analytics)
		})

		adminRoutes.GET("/analytics/orders", func(c *gin.Context) {
			daysStr := c.DefaultQuery("days", "7")
			days := 7
			if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
				days = d
			}
			analytics, err := adminService.GetOrdersAnalytics(days)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, analytics)
		})

		adminRoutes.GET("/analytics/user-growth", func(c *gin.Context) {
			daysStr := c.DefaultQuery("days", "30")
			days := 30
			if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
				days = d
			}
			analytics, err := adminService.GetUserGrowthAnalytics(days)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, analytics)
		})

		// Users management
		adminRoutes.GET("/users", func(c *gin.Context) {
			page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
			limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
			search := c.Query("search")

			if page < 1 {
				page = 1
			}
			if limit < 1 || limit > 100 {
				limit = 10
			}

			users, total, err := adminService.GetAllUsers(page, limit, search)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"users": users, "total": total})
		})

		// Providers management
		adminRoutes.GET("/providers", func(c *gin.Context) {
			page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
			limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
			search := c.Query("search")
			status := c.Query("status")

			if page < 1 {
				page = 1
			}
			if limit < 1 || limit > 100 {
				limit = 10
			}

			providers, total, err := adminService.GetAllProviders(page, limit, search, status)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"providers": providers, "total": total})
		})

		// Couriers management
		adminRoutes.GET("/couriers", func(c *gin.Context) {
			page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
			limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
			search := c.Query("search")
			status := c.Query("status")

			if page < 1 {
				page = 1
			}
			if limit < 1 || limit > 100 {
				limit = 10
			}

			couriers, total, err := adminService.GetAllCouriers(page, limit, search, status)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"couriers": couriers, "total": total})
		})

		// Orders management
		adminRoutes.GET("/orders", func(c *gin.Context) {
			page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
			limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
			search := c.Query("search")
			status := c.Query("status")

			if page < 1 {
				page = 1
			}
			if limit < 1 || limit > 100 {
				limit = 10
			}

			orders, total, err := adminService.GetAllOrders(page, limit, search, status)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"orders": orders, "total": total})
		})

		// User management endpoints
		adminRoutes.GET("/users/:id", handleGetUserById(adminService))
		adminRoutes.PUT("/users/:id", handleUpdateUser(adminService))
		adminRoutes.PUT("/users/:id/block", handleBlockUser(adminService))
		adminRoutes.PUT("/users/:id/unblock", handleUnblockUser(adminService))
		adminRoutes.DELETE("/users/:id", handleDeleteUser(adminService))

		// Provider management endpoints
		adminRoutes.GET("/providers/:id", handleGetProviderById(adminService))
		adminRoutes.PUT("/providers/:id", handleUpdateProvider(adminService))
		adminRoutes.PUT("/providers/:id/status", handleUpdateProviderStatus(adminService))
		adminRoutes.PUT("/providers/:id/verify", handleVerifyProvider(adminService))
		adminRoutes.PUT("/providers/:id/suspend", handleSuspendProvider(adminService))

		// Courier management endpoints
		adminRoutes.GET("/couriers/:id", handleGetCourierById(adminService))
		adminRoutes.PUT("/couriers/:id/status", handleUpdateCourierStatus(adminService))
		adminRoutes.PUT("/couriers/:id/suspend", handleSuspendCourier(adminService))

		// Order management endpoints
		adminRoutes.GET("/orders/:id", handleGetOrderById(adminService))
		adminRoutes.PUT("/orders/:id/status", handleUpdateOrderAdminStatus(adminService))
		adminRoutes.PUT("/orders/:id/moderate", handleModerateOrder(adminService))
		adminRoutes.PUT("/orders/:id/cancel", handleCancelOrderAdmin(adminService))
		adminRoutes.PUT("/orders/:id/assign-courier", handleAdminAssignCourier(orderService))

		// Settings, reports, and audit endpoints
		adminRoutes.GET("/settings", handleGetSettings())
		adminRoutes.PUT("/settings", handleUpdateSettings())
		adminRoutes.GET("/reports", handleGetReports())
		adminRoutes.GET("/disputes", handleGetDisputes())
		adminRoutes.PUT("/disputes/:id/resolve", handleResolveDispute())
		adminRoutes.GET("/export/:type", handleExportData())
		adminRoutes.GET("/logs/audit", handleGetAuditLogs())
	}

	// Start the server
	router.Run(":8080")
}

func handleSignUp(authService *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		var signUpData struct {
			Email         string        `json:"email" binding:"required,email"`
			Password      string        `json:"password" binding:"required,min=6"`
			UserType      user.UserType `json:"user_type" binding:"required"`
			ExpoPushToken string        `json:"expoPushToken"`
			Name          string        `json:"name"`
			PhoneNumber   string        `json:"phone_number"`
		}

		if err := c.ShouldBindJSON(&signUpData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		log.Println(signUpData)
		newUser, err := authService.SignUp(signUpData.Email, signUpData.Password, signUpData.UserType, signUpData.ExpoPushToken, signUpData.Name, signUpData.PhoneNumber)
		if err != nil {
			log.Println(err)
			// Check if the error is due to database unavailability
			if strings.Contains(err.Error(), "database connection unavailable") {
				c.JSON(http.StatusServiceUnavailable, gin.H{
					"error":   "Service temporarily unavailable",
					"message": "Database connection is currently unavailable. Please try again later.",
				})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, newUser)
	}
}

func handleVerifyPhone(authService *auth.Service, userService *user.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Phone          string `json:"phone" binding:"required"`
			SupabaseUserID string `json:"supabaseUserId" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request payload"})
			return
		}

		// Convert string SupabaseUserID to uuid.UUID
		supabaseUUID, err := uuid.Parse(req.SupabaseUserID)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid Supabase User ID format"})
			return
		}

		// Check if user exists by phone, or create a new one
		existingUser, err := userService.GetUserByPhoneNumber(req.Phone)
		if err != nil && !errors.Is(err, user.ErrUserNotFound) {
			c.JSON(500, gin.H{"error": "Failed to check user existence"})
			return
		}

		var u *user.User
		if existingUser == nil {
			// Create new user if not found
			newUser := &user.User{
				PhoneNumber:    req.Phone,
				SupabaseUserID: &supabaseUUID,
				UserType:       user.UserTypeCustomer, // Default, adjust as needed
			}
			u, err = userService.CreateUser(newUser)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to create user"})
				return
			}
		} else {
			// Update existing user with Supabase ID if not set
			if existingUser.SupabaseUserID == nil {
				existingUser.SupabaseUserID = &supabaseUUID
				err = userService.UpdateUser(existingUser)
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to update user"})
					return
				}
			}
			u = existingUser
		}

		// Generate JWT token
		token, err := authService.GenerateToken(u.ID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to generate token"})
			return
		}

		c.JSON(200, gin.H{
			"token": token,
			"user":  u,
		})
	}
}
func handleSignIn(authService *auth.Service, db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var signInData struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}

		if err := c.ShouldBindJSON(&signInData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		user, token, err := authService.SignIn(signInData.Email, signInData.Password)
		if err != nil {
			// Check if the error is due to database unavailability
			if strings.Contains(err.Error(), "database connection unavailable") {
				c.JSON(http.StatusServiceUnavailable, gin.H{
					"error":   "Service temporarily unavailable",
					"message": "Database connection is currently unavailable. Please try again later.",
				})
				return
			}
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		// Fetch admin role and permissions if user is an admin
		var adminRole *string
		var adminPermissions []string
		err = db.QueryRow(`
			SELECT admin_role, COALESCE(permissions, ARRAY[]::text[]) FROM admin_users
			WHERE id = $1 AND is_active = true
		`, user.ID).Scan(&adminRole, &adminPermissions)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			// Log but don't fail the login
			log.Printf("Warning: Failed to fetch admin role and permissions for user %s: %v\n", user.ID, err)
		}

		response := gin.H{
			"user":  user,
			"token": token,
		}
		if adminRole != nil {
			response["admin_role"] = *adminRole
			response["admin_permissions"] = adminPermissions
		}

		c.JSON(http.StatusOK, response)
	}
}

func handleSignOut(authService *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract user ID from token (assumes middleware sets it)
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		userUUID := userID.(uuid.UUID)

		// Call SignOut (optional cleanup)
		if err := authService.SignOut(userUUID); err != nil {
			c.JSON(500, gin.H{"error": "Failed to sign out"})
			return
		}

		// Always return success for stateless JWT logout
		c.JSON(200, gin.H{"message": "Successfully signed out"})
	}
}
func handleGetProfile(userService *user.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		userUUID := userID.(uuid.UUID)
		user, err := userService.GetUserByID(userUUID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusOK, user)
	}
}

// Handle user profile updates
func handleUpdateProfile(userService *user.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context
		userID, exists := c.Get("userID")
		if !exists {
			log.Printf("[ProfileUpdate] Error: No userID found in context")
			c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found"})
			return
		}

		// Create struct to receive update data
		var updateData struct {
			PhoneNumber   string `json:"phone_number"`
			OriginalPhone string `json:"original_phone,omitempty"` // For logging purposes
		}

		// Bind JSON data
		if err := c.ShouldBindJSON(&updateData); err != nil {
			log.Printf("[ProfileUpdate] JSON binding error: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Log received data
		log.Printf("[ProfileUpdate] Received update request:")
		userUUID := userID.(uuid.UUID)
		log.Printf("  → User ID: %s", userUUID.String())
		log.Printf("  → New phone number: %s", updateData.PhoneNumber)
		if updateData.OriginalPhone != "" {
			log.Printf("  → Original phone input: %s", updateData.OriginalPhone)
		}

		// Create user object for update
		userToUpdate := &user.User{
			ID:          userUUID,
			PhoneNumber: updateData.PhoneNumber,
		}

		// Call UpdateUser service
		err := userService.UpdateUser(userToUpdate)
		if err != nil {
			log.Printf("[ProfileUpdate] Failed to update user: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
			return
		}

		log.Printf("[ProfileUpdate] Successfully updated phone number for user ID: %s", userUUID.String())
		c.JSON(http.StatusOK, gin.H{
			"message":       "Profile updated successfully",
			"updated_phone": updateData.PhoneNumber,
		})
	}
}

func handleCreateOrder(orderService *order.Service, inventoryService *inventory.Service, db *sql.DB, hub *realtime.Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("Starting order creation process - Method: %s", c.Request.Method)

		var newOrder order.Order

		if err := c.ShouldBindJSON(&newOrder); err != nil {
			log.Printf("ERROR: Invalid order request body: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Log the received order data
		log.Printf("Received order data: %+v", newOrder)

		// Validate required fields
		if newOrder.ProviderID == nil || newOrder.CylinderType == "" || newOrder.Quantity <= 0 {
			log.Printf("ERROR: Missing required fields")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
			return
		}

		// Get user ID from context
		userID, exists := c.Get("userID")
		if !exists {
			log.Printf("ERROR: Unauthorized access - User ID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
			return
		}

		newOrder.UserID = userID.(uuid.UUID)

		// Get cylinder price
		// TODO: Update inventory service to use UUID instead of ObjectID
		price := 100.0

		// Check if price is zero
		if price <= 0 {
			providerIDStr := "unknown"
			if newOrder.ProviderID != nil {
				providerIDStr = newOrder.ProviderID.String()
			}
			log.Printf("WARNING: Cylinder price is zero for ProviderID: %s, CylinderType: %s", providerIDStr, newOrder.CylinderType)
			// Handle this case appropriately, maybe set a default price or return an error
		}

		// Calculate all prices
		newOrder.PricePerUnit = price
		newOrder.TotalPrice = price * float64(newOrder.Quantity)
		newOrder.DeliveryFee = 10.0                         // Fixed delivery fee
		newOrder.ServiceCharge = newOrder.TotalPrice * 0.05 // 5% service charge
		newOrder.GrandTotal = newOrder.TotalPrice + newOrder.DeliveryFee + newOrder.ServiceCharge

		// Set timestamps
		now := time.Now()
		newOrder.CreatedAt = now
		newOrder.UpdatedAt = now

		// Set default status if not provided
		if newOrder.Status == "" {
			newOrder.Status = "pending"
		}
		if newOrder.PaymentStatus == "" {
			newOrder.PaymentStatus = "pending"
		}

		// Log calculated prices
		log.Printf("Calculated prices - Price per Unit: %.2f, Total Price: %.2f, Delivery Fee: %.2f, Service Charge: %.2f, Grand Total: %.2f", newOrder.PricePerUnit, newOrder.TotalPrice, newOrder.DeliveryFee, newOrder.ServiceCharge, newOrder.GrandTotal)

		// Create the order
		createdOrder, err := orderService.CreateOrder(&newOrder)
		if err != nil {
			log.Printf("ERROR: Failed to create order: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create order: %v", err)})
			return
		}

		log.Printf("Order created successfully - Order ID: %v", createdOrder.ID)

		// Broadcast order creation event via WebSocket
		hub.BroadcastOrderCreated(createdOrder.ID.String(), createdOrder.UserID.String(), gin.H{
			"order_id":      createdOrder.ID,
			"status":        createdOrder.Status,
			"cylinder_type": createdOrder.CylinderType,
			"quantity":      createdOrder.Quantity,
			"grand_total":   createdOrder.GrandTotal,
		})

		c.JSON(http.StatusCreated, gin.H{
			"message": "Order created successfully",
			"order":   createdOrder,
		})
	}
}

// handleGoogleLogin initiates Google OAuth flow
func handleGoogleLogin() gin.HandlerFunc {
	return func(c *gin.Context) {
		config := auth.GetGoogleOAuthConfig()
		url := config.AuthCodeURL("state", oauth2.AccessTypeOffline)
		c.Redirect(http.StatusTemporaryRedirect, url)
	}
}

// handleGoogleCallback handles Google OAuth callback
func handleGoogleCallback(authService *auth.Service, userService *user.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		code := c.Query("code")
		if code == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No authorization code provided"})
			return
		}

		// Exchange code for token
		token, err := auth.ExchangeCodeForToken(code)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to exchange token"})
			return
		}

		// Get user info from Google
		googleUser, err := auth.GetGoogleUserInfo(token.AccessToken)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
			return
		}

		// Check if user exists
		existingUser, err := userService.GetUserByEmail(googleUser.Email)
		var userID uuid.UUID

		if err != nil && !errors.Is(err, user.ErrUserNotFound) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}

		if existingUser != nil {
			// User exists, log them in
			userID = existingUser.ID
		} else {
			// Create new user
			newUser := &user.User{
				Email:       googleUser.Email,
				Name:        googleUser.Name,
				Password:    "", // No password for OAuth users
				UserType:    user.UserTypeCustomer,
				PhoneNumber: "",
			}

			createdUser, err := userService.CreateUser(newUser)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
				return
			}
			userID = createdUser.ID
		}

		// Generate JWT token
		jwtToken, err := authService.GenerateToken(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"token": jwtToken,
			"user": gin.H{
				"id":    userID,
				"email": googleUser.Email,
				"name":  googleUser.Name,
			},
		})
	}
}

func handleUpdateOrderStatus(orderService *order.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid order ID"})
			return
		}

		var body struct {
			Status string `json:"status"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request body"})
			return
		}

		// Get courier ID from context (set by AuthMiddleware)
		courierID := uuid.UUID{}
		if userID, exists := c.Get("userID"); exists {
			courierID = userID.(uuid.UUID)
		}

		err = orderService.UpdateOrderStatus(orderID, order.OrderStatus(body.Status), courierID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true})
	}
}

func handleGetUserOrders(orderService *order.Service) gin.HandlerFunc {

	return func(c *gin.Context) {
		log.Println("Getting orders.....")
		userID, _ := c.Get("userID")
		orders, err := orderService.GetUserOrders(userID.(uuid.UUID))

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
			return
		}
		c.JSON(http.StatusOK, orders)
	}
}

func handleGetProviderOrders(orderService *order.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerID, _ := c.Get("userID")
		orders, err := orderService.GetProviderOrders(providerID.(uuid.UUID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
			return
		}
		c.JSON(http.StatusOK, orders)
	}
}
func handleAcceptOrder(orderService *order.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID := c.Param("id")
		if orderID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Order ID is missing"})
			return
		}

		orderUUID, err := uuid.Parse(orderID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID format"})
			return
		}

		providerID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Provider ID not found in context"})
			return
		}

		providerUUID := providerID.(uuid.UUID)

		err = orderService.AcceptOrder(providerUUID, orderUUID)
		if err != nil {
			log.Printf("Failed to accept order: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to accept order: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Order accepted successfully"})
	}
}
func handleRejectOrder(orderService *order.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}
		err = orderService.RejectOrder(orderID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject order"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Order rejected successfully"})
	}
}

func handleGetCourierOrders(orderService *order.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		courierID, _ := c.Get("userID")
		orders, err := orderService.GetCourierOrders(courierID.(uuid.UUID))
		if err != nil {
			log.Printf("Error fetching courier orders: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
			return
		}
		c.JSON(http.StatusOK, orders)
	}
}

// Add a handler for updating payment status
// Update the handler to properly handle the PaymentStatus type
func handleUpdateOrderPaymentStatus(orderService *order.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "Invalid order ID",
			})
			return
		}

		var body struct {
			PaymentStatus order.PaymentStatus `json:"payment_status"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "Invalid request body",
			})
			return
		}

		// Validate payment status
		switch body.PaymentStatus {
		case order.PaymentStatusPending, order.PaymentStatusPaid, order.PaymentStatusFailed, order.PaymentStatusRefunded:
			// Valid status
		default:
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "Invalid payment status",
			})
			return
		}

		err = orderService.UpdateOrderPaymentStatus(orderID, body.PaymentStatus)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Payment status updated successfully",
		})
	}
}

func isValidStatusTransition(currentStatus order.OrderStatus, newStatus string) bool {
	validTransitions := map[order.OrderStatus][]string{
		order.OrderStatusPending:   {"accepted", "rejected"},
		order.OrderStatusAccepted:  {"in-transit"},
		order.OrderStatusInTransit: {"delivered"},
	}

	allowedStatuses, exists := validTransitions[currentStatus]
	if !exists {
		return false
	}

	for _, status := range allowedStatuses {
		if status == newStatus {
			return true
		}
	}

	return false
}

func handleUpdateLocation(locationService *location.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		courierID, _ := c.Get("userID")
		courierUUID := courierID.(uuid.UUID)

		var locationData struct {
			Latitude   float64 `json:"latitude"`
			Longitude  float64 `json:"longitude"`
			StreetName string  `json:"street_name"`
		}

		if err := c.ShouldBindJSON(&locationData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		mockLocation := location.Location{
			ID:         uuid.New(),
			CourierID:  courierUUID,
			Latitude:   locationData.Latitude,
			Longitude:  locationData.Longitude,
			StreetName: locationData.StreetName,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}

		err := locationService.UpdateLocation(&mockLocation)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update location"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Location updated successfully", "location": mockLocation})
	}
}

func handleGetProviders(userService *user.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Println("📍 GET /providers endpoint called")

		// Get all users with provider type
		log.Println("🔄 Fetching all providers from database...")
		providers, err := userService.GetAllProviders()
		if err != nil {
			log.Printf("❌ Failed to fetch providers: %v\n", err)
			log.Printf("   Error type: %T\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to fetch providers",
				"details": err.Error(),
			})
			return
		}

		log.Printf("✅ Successfully fetched %d providers\n", len(providers))
		c.JSON(http.StatusOK, providers)
	}
}

func handleTrackOrder(orderService *order.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}
		order, err := orderService.GetOrderByID(orderID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}
		if order.CourierID == nil {
			c.JSON(http.StatusOK, gin.H{"status": order.Status, "location": nil})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": order.Status, "location": gin.H{"latitude": order.CurrentLatitude, "longitude": order.CurrentLongitude, "address": order.CurrentAddress}})
	}
}

func handleUpdateOrderLocation(orderService *order.Service, locationService *location.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the order ID from the URL parameter
		orderID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		// Get the courier ID from the context
		courierID, _ := c.Get("userID")
		courierUUID := courierID.(uuid.UUID)

		// Parse the location data from the request body
		var locationData struct {
			Latitude   float64 `json:"latitude" binding:"required"`
			Longitude  float64 `json:"longitude" binding:"required"`
			StreetName string  `json:"street_name" binding:"required"`
		}
		if err := c.ShouldBindJSON(&locationData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Create a new location object
		newLocation := &location.Location{
			ID:         uuid.New(),
			CourierID:  courierUUID,
			Latitude:   locationData.Latitude,
			Longitude:  locationData.Longitude,
			StreetName: locationData.StreetName,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}

		// Update the location in the location service
		err = locationService.UpdateLocation(newLocation)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update location"})
			return
		}

		// Update the order's current location
		err = orderService.UpdateOrderLocation(orderID, newLocation)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order location"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":  "Order location updated successfully",
			"location": newLocation,
		})
	}
}

func handleGetBestProvider(userService *user.Service, orderService *order.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		// Get the customer's current location
		customer, err := userService.GetUserByID(userID.(uuid.UUID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get customer information"})
			return
		}

		bestProvider, err := findBestProvider(userService, customer.Latitude, customer.Longitude)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get best provider: %v", err)})
			return
		}

		c.JSON(http.StatusOK, bestProvider)
	}
}

func findBestProvider(userService *user.Service, customerLat, customerLon *float64) (*user.ProviderWithDistance, error) {
	providers, err := userService.GetAllProviders()
	if err != nil {
		return nil, err
	}

	var nearestProvider *user.ProviderWithDistance
	var shortestDistance float64

	// Handle nil coordinates
	if customerLat == nil || customerLon == nil {
		return nil, fmt.Errorf("customer location not available")
	}

	for _, provider := range providers {
		if provider.Latitude == nil || provider.Longitude == nil {
			continue // Skip providers without location
		}
		distance := calculateDistance(
			*customerLat,
			*customerLon,
			*provider.Latitude,
			*provider.Longitude,
		)

		if nearestProvider == nil || distance < shortestDistance {
			nearestProvider = &user.ProviderWithDistance{
				User:     provider,
				Distance: distance,
			}
			shortestDistance = distance
		}
	}

	return nearestProvider, nil
}

func calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	// Haversine formula
	const R = 6371 // Earth radius in kilometers

	dLat := (lat2 - lat1) * (math.Pi / 180)
	dLon := (lon2 - lon1) * (math.Pi / 180)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*(math.Pi/180))*math.Cos(lat2*(math.Pi/180))*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}

func handleUpdateUserLocation(userService *user.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var locationUpdate struct {
			Latitude  float64 `json:"latitude" binding:"required"`
			Longitude float64 `json:"longitude" binding:"required"`
		}
		if err := c.ShouldBindJSON(&locationUpdate); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		userLocation := user.Location{
			Latitude:  locationUpdate.Latitude,
			Longitude: locationUpdate.Longitude,
		}
		err := userService.UpdateUserLocation(userID.(uuid.UUID), userLocation)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update location"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Location updated successfully"})
	}
}

// OrderResponse combines Order and User data
type OrderResponse struct {
	ID              uuid.UUID  `json:"id,omitempty"`
	UserID          uuid.UUID  `json:"user_id"`
	ProviderID      *uuid.UUID `json:"provider_id,omitempty"`
	CourierID       *uuid.UUID `json:"courier_id,omitempty"`
	Status          string     `json:"status"`
	CylinderType    string     `json:"cylinder_type"`
	Quantity        int        `json:"quantity"`
	PricePerUnit    float64    `json:"price_per_unit"`
	TotalPrice      float64    `json:"total_price"`
	DeliveryFee     float64    `json:"delivery_fee"`
	ServiceCharge   float64    `json:"service_charge"`
	GrandTotal      float64    `json:"grand_total"`
	DeliveryAddress string     `json:"delivery_address"`
	PaymentMethod   string     `json:"payment_method"`
	PaymentStatus   string     `json:"payment_status"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	User            struct {
		ID    uuid.UUID `json:"id"`
		Name  string    `json:"name"`
		Email string    `json:"email"`
		Phone string    `json:"phone"`
	} `json:"user"`
}

func handleGetSingleOrder(orderService *order.Service, userService *user.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		order, err := orderService.GetOrderByID(orderID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch order"})
			return
		}
		if order == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}

		// Fetch user details
		userData, err := userService.GetUserByID(order.UserID)
		if err != nil {
			if err == user.ErrUserNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user details"})
			}
			return
		}

		// Create the response
		response := OrderResponse{
			ID:              order.ID,
			UserID:          order.UserID,
			ProviderID:      order.ProviderID,
			CourierID:       order.CourierID,
			Status:          string(order.Status),
			CylinderType:    string(order.CylinderType),
			Quantity:        order.Quantity,
			PricePerUnit:    order.PricePerUnit,
			TotalPrice:      order.TotalPrice,
			DeliveryFee:     order.DeliveryFee,
			ServiceCharge:   order.ServiceCharge,
			GrandTotal:      order.GrandTotal,
			DeliveryAddress: order.DeliveryAddress,
			PaymentMethod:   order.PaymentMethod,
			PaymentStatus:   string(order.PaymentStatus),
			CreatedAt:       order.CreatedAt,
			UpdatedAt:       order.UpdatedAt,
		}

		// Add user data to the response
		response.User.ID = userData.ID
		response.User.Name = userData.Name
		response.User.Email = userData.Email
		response.User.Phone = userData.PhoneNumber

		c.JSON(http.StatusOK, response)
	}
}
func handleGetUserDetails(userService *user.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the user ID from the URL parameter
		userID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		// Get the current user's ID
		currentUserID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}
		log.Println(currentUserID)

		// currentUserObjectID, ok := currentUserID.(primitive.ObjectID)
		// if !ok {
		// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		// 	return
		// }

		// // Check if the current user is requesting their own details
		// if userID != currentUserObjectID {
		// 	c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to view this user's details"})
		// 	return
		// }

		// Get the user details
		userDetails, err := userService.GetUserByID(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user details"})
			return
		}
		if userDetails == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Remove sensitive information
		userDetails.Password = ""

		c.JSON(http.StatusOK, userDetails)
	}
}

func handleAddInventoryItem(inventoryService *inventory.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		var item inventory.InventoryItem
		if err := c.ShouldBindJSON(&item); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		providerID, _ := c.Get("userID")
		item.ProviderID = providerID.(uuid.UUID)

		if err := inventoryService.AddInventoryItem(&item); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add inventory item"})
			return
		}

		c.JSON(http.StatusCreated, item)
	}
}

func handleUpdateInventoryItem(inventoryService *inventory.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		var item inventory.InventoryItem
		if err := c.ShouldBindJSON(&item); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		itemID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
			return
		}
		item.ID = itemID

		providerID, _ := c.Get("userID")
		item.ProviderID = providerID.(uuid.UUID)

		if err := inventoryService.UpdateInventoryItem(&item); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update inventory item"})
			return
		}

		c.JSON(http.StatusOK, item)
	}
}

func handleGetProviderInventory(inventoryService *inventory.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerID, _ := c.Get("userID")
		items, err := inventoryService.GetProviderInventory(providerID.(uuid.UUID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory"})
			return
		}
		c.JSON(http.StatusOK, items)
	}
}

func handleUpdateStock(inventoryService *inventory.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		var updateData struct {
			CylinderType string `json:"cylinder_type" binding:"required"`
			Quantity     int    `json:"quantity" binding:"required"`
		}
		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		providerID, _ := c.Get("userID")

		if err := inventoryService.UpdateStock(providerID.(uuid.UUID), inventory.CylinderType(updateData.CylinderType), updateData.Quantity); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Stock updated successfully"})
	}
}

func handleGetPriceByProviderAndCylinderType(provider *provider.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerID := c.Param("provider_id")
		cylinderType := c.Param("cylinder_type")

		if providerID == "" || cylinderType == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error no provider or cylunder type specified"})
			return
		}

		price, err := provider.FindPriceByProviderAndCylinderType(providerID, cylinderType)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch price"})
			return

		}

		c.JSON(http.StatusOK, gin.H{"data": price})
	}
}
func handleUploadProviderImage(providerService *provider.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Start a timer for request duration tracking
		start := time.Now()

		// Get provider ID from POST data
		providerID := c.PostForm("providerID")
		if providerID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Provider ID is required"})
			c.Error(errors.New("No provider ID in request")).SetType(gin.ErrorTypePrivate)
			return
		}

		// Get the uploaded file
		file, err := c.FormFile("image")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
			c.Error(err).SetType(gin.ErrorTypePrivate)
			return
		}

		// Open the file
		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not read file"})
			c.Error(err).SetType(gin.ErrorTypePrivate)
			return
		}
		defer src.Close()

		// Upload image with additional context logging
		err = providerService.UploadProviderImage(providerID, src, file)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			c.Error(err).SetType(gin.ErrorTypePrivate)
			return
		}

		// Log successful upload with request duration
		c.Set("response_time", time.Since(start))

		c.JSON(http.StatusOK, gin.H{"message": "Image uploaded successfully"})
	}
}

func handleGetProviderImage(providerService *provider.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerID := c.Param("provider_id")

		_, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// Query the provider to get the image path
		provider, err := providerService.GetProviderById(providerID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Provider not found"})
			return
		}

		imagePath := provider.ProfileImage
		if imagePath == "" {
			c.JSON(http.StatusNotFound, gin.H{"error": "No image found for this provider"})
			return
		}

		// Check if file exists
		_, err = os.Stat(imagePath)
		if err != nil {
			if os.IsNotExist(err) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Image file not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check image existence"})
			}
			return
		}

		// Determine content type based on file extension
		ext := strings.ToLower(filepath.Ext(imagePath))
		contentType := "application/octet-stream"
		switch ext {
		case ".jpg", ".jpeg":
			contentType = "image/jpeg"
		case ".png":
			contentType = "image/png"
		case ".gif":
			contentType = "image/gif"
		case ".webp":
			contentType = "image/webp"
		}

		// Set headers and serve the file
		c.Header("Content-Type", contentType)
		c.File(imagePath)
	}
}

func handleGetProviderByIdCustomer(providerService *provider.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerID := c.Param("provider_id")

		provider, err := providerService.GetProviderById(providerID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch provider"})
			return
		}
		if provider == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Provider not found"})
			return
		}

		c.JSON(http.StatusOK, provider)
	}
}

// Preferences handlers
func handleGetPreferences(preferencesService *preferences.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		userUUID := userID.(uuid.UUID)

		prefs, err := preferencesService.GetUserPreferences(userUUID)
		if err != nil {
			if err == preferences.ErrPreferencesNotFound {
				c.JSON(http.StatusOK, gin.H{"preferences": nil})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch preferences"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"preferences": prefs})
	}
}

func handleUpsertPreferences(preferencesService *preferences.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		userUUID := userID.(uuid.UUID)

		var prefs preferences.UserPreferences
		if err := c.ShouldBindJSON(&prefs); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		result, err := preferencesService.UpsertUserPreferences(userUUID, &prefs)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update preferences"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"preferences": result})
	}
}

func handleUpdateCylinderPreference(preferencesService *preferences.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		userUUID := userID.(uuid.UUID)

		var body struct {
			CylinderType string `json:"cylinder_type" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := preferencesService.UpdateCylinderPreference(userUUID, body.CylinderType)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cylinder preference"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Cylinder preference updated successfully"})
	}
}

// Provider preference functionality removed - use location-based matching instead
// func handleUpdateProviderPreference(preferencesService *preferences.Service) gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		userID, _ := c.Get("userID")
// 		userUUID := userID.(uuid.UUID)
//
// 		var body struct {
// 			ProviderID string `json:"provider_id" binding:"required"`
// 		}
// 		if err := c.ShouldBindJSON(&body); err != nil {
// 			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 			return
// 		}
//
// 		providerUUID, err := uuid.Parse(body.ProviderID)
// 		if err != nil {
// 			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
// 			return
// 		}
//
// 		err = preferencesService.UpdateProviderPreference(userUUID, providerUUID)
// 		if err != nil {
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update provider preference"})
// 			return
// 		}
//
// 		c.JSON(http.StatusOK, gin.H{"message": "Provider preference updated successfully"})
// 	}
// }

func handleGetNearestProvider(userService *user.Service, preferencesService *preferences.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		// Get the customer's current location
		customer, err := userService.GetUserByID(userID.(uuid.UUID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get customer information"})
			return
		}

		// Find best provider using existing logic
		bestProvider, err := findBestProvider(userService, customer.Latitude, customer.Longitude)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to find nearest provider: %v", err)})
			return
		}

		// Provider preferences removed - location-based matching is always used
		// if savePreference && bestProvider != nil {
		//	_ = preferencesService.UpdateProviderPreference(userID.(uuid.UUID), bestProvider.User.ID)
		// }

		c.JSON(http.StatusOK, gin.H{
			"provider": bestProvider,
			"saved":    false, // Always false since provider preferences are no longer stored
		})
	}
}

func handleAcceptAssignment(orderService *order.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		courierIDInterface, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		courierID := courierIDInterface.(uuid.UUID)

		if err := orderService.AcceptCourierAssignment(orderID, courierID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Assignment accepted successfully"})
	}
}

func handleDeclineAssignment(orderService *order.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		courierIDInterface, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		courierID := courierIDInterface.(uuid.UUID)

		if err := orderService.DeclineCourierAssignment(orderID, courierID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Assignment declined successfully"})
	}
}

func handleAdminAssignCourier(orderService *order.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		var body struct {
			CourierID string `json:"courier_id" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		courierID, err := uuid.Parse(body.CourierID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid courier ID"})
			return
		}

		if err := orderService.AdminAssignCourier(orderID, courierID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Courier assigned successfully"})
	}
}
