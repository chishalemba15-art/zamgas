package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yakumwamba/lpg-delivery-system/internal/admin"
)

// Admin login handler - separate from regular user login
func handleAdminLogin(adminAuthService *admin.AdminAuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var loginReq struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}

		if err := c.ShouldBindJSON(&loginReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid request format",
			})
			return
		}

		// Authenticate admin
		adminUser, token, err := adminAuthService.AdminSignIn(loginReq.Email, loginReq.Password)
		if err != nil {
			// Temporary: Return actual error message for debugging
			fmt.Printf("DEBUG: Admin login error for %s: %v\n", loginReq.Email, err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": fmt.Sprintf("Authentication failed: %v", err),
			})
			return
		}

		// Don't send password in response
		adminUser.Password = ""

		c.JSON(http.StatusOK, gin.H{
			"token": token,
			"admin": gin.H{
				"id":          adminUser.ID,
				"email":       adminUser.Email,
				"name":        adminUser.Name,
				"admin_role":  adminUser.AdminRole,
				"permissions": adminUser.Permissions,
			},
		})
	}
}

// Admin middleware - validates admin token and sets admin info in context
func adminAuthMiddleware(adminAuthService *admin.AdminAuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
			})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix if present
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		// Validate admin token
		adminID, role, err := adminAuthService.ValidateAdminToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Get full admin details
		adminUser, err := adminAuthService.GetAdminByID(adminID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Admin not found",
			})
			c.Abort()
			return
		}

		if !adminUser.IsActive {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Admin account is inactive",
			})
			c.Abort()
			return
		}

		// Set admin info in context for use in handlers
		c.Set("admin_id", adminID)
		c.Set("admin_role", role)
		c.Set("admin_user", adminUser)

		c.Next()
	}
}

// Admin info handler - returns current admin's info
func handleGetAdminInfo(adminAuthService *admin.AdminAuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		adminUser, exists := c.Get("admin_user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Admin not found in context",
			})
			return
		}

		admin := adminUser.(*admin.AdminUser)
		admin.Password = "" // Don't send password

		c.JSON(http.StatusOK, gin.H{
			"admin": gin.H{
				"id":          admin.ID,
				"email":       admin.Email,
				"name":        admin.Name,
				"admin_role":  admin.AdminRole,
				"permissions": admin.Permissions,
				"last_login":  admin.LastLogin,
				"created_at":  admin.CreatedAt,
			},
		})
	}
}
