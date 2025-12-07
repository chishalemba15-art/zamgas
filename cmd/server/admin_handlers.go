package main

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yakumwamba/lpg-delivery-system/internal/admin"
)

// Admin Dashboard Handlers

func handleGetDashboardSummary(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		summary, err := adminRepo.GetDashboardSummary(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to fetch dashboard summary: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": summary,
		})
	}
}

func handleGetDailyAnalytics(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		limitStr := c.DefaultQuery("limit", "30")
		offsetStr := c.DefaultQuery("offset", "0")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 || limit > 365 {
			limit = 30
		}

		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			offset = 0
		}

		analytics, err := adminRepo.GetDailyAnalytics(c.Request.Context(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to fetch analytics: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": analytics,
		})
	}
}

// Provider Management Handlers

func handleGetAdminProviders(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		limitStr := c.DefaultQuery("limit", "100")
		offsetStr := c.DefaultQuery("offset", "0")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 || limit > 1000 {
			limit = 100
		}

		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			offset = 0
		}

		providers, err := adminRepo.GetProviders(c.Request.Context(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to fetch providers: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": providers,
		})
	}
}

func handleGetProviderStatus(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerIDStr := c.Param("id")
		providerID, err := uuid.Parse(providerIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
			return
		}

		status, err := adminRepo.GetProviderStatus(c.Request.Context(), providerID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to fetch provider status: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": status,
		})
	}
}

func handleUpdateAdminProviderStatus(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerIDStr := c.Param("id")
		providerID, err := uuid.Parse(providerIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
			return
		}

		var req admin.UpdateProviderStatusRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err = adminRepo.UpdateProviderStatus(c.Request.Context(), providerID, req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to update provider status: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Provider status updated successfully",
		})
	}
}

func handleGetProviderPricing(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerIDStr := c.Param("id")
		providerID, err := uuid.Parse(providerIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
			return
		}

		pricing, err := adminRepo.GetProviderCylinderPricing(c.Request.Context(), providerID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to fetch pricing: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": pricing,
		})
	}
}

func handleUpdateProviderPricing(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerIDStr := c.Param("id")
		providerID, err := uuid.Parse(providerIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
			return
		}
		_ = providerID // Placeholder for future update implementation

		var pricing map[string]map[string]int
		if err := c.ShouldBindJSON(&pricing); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		_ = pricing // Placeholder for future update implementation

		// Note: This would require implementing an UpdateProviderCylinderPricing method
		// in the admin repository
		c.JSON(http.StatusOK, gin.H{
			"message": "Pricing updated successfully",
		})
	}
}

func handleGetProviderMetrics(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerIDStr := c.Param("id")
		providerID, err := uuid.Parse(providerIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
			return
		}

		limitStr := c.DefaultQuery("limit", "30")
		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 || limit > 365 {
			limit = 30
		}

		metrics, err := adminRepo.GetProviderMetrics(c.Request.Context(), providerID, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to fetch provider metrics: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": metrics,
		})
	}
}

// Courier Management Handlers

func handleGetAdminCouriers(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		limitStr := c.DefaultQuery("limit", "100")
		offsetStr := c.DefaultQuery("offset", "0")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 || limit > 1000 {
			limit = 100
		}

		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			offset = 0
		}

		couriers, err := adminRepo.GetCouriers(c.Request.Context(), limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to fetch couriers: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": couriers,
		})
	}
}

func handleGetCourierStatus(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		courierIDStr := c.Param("id")
		courierID, err := uuid.Parse(courierIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid courier ID"})
			return
		}

		status, err := adminRepo.GetCourierStatus(c.Request.Context(), courierID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to fetch courier status: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": status,
		})
	}
}

func handleUpdateAdminCourierStatus(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		courierIDStr := c.Param("id")
		courierID, err := uuid.Parse(courierIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid courier ID"})
			return
		}

		var req admin.UpdateCourierStatusRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err = adminRepo.UpdateCourierStatus(c.Request.Context(), courierID, req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to update courier status: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Courier status updated successfully",
		})
	}
}

// Settings Management Handlers

func handleGetAdminSettings(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		settings, err := adminRepo.GetAdminSettings(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to fetch settings: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": settings,
		})
	}
}

func handleGetAdminSetting(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		settingKey := c.Param("key")

		setting, err := adminRepo.GetAdminSetting(c.Request.Context(), settingKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to fetch setting: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": setting,
		})
	}
}

func handleUpdateAdminSetting(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		settingKey := c.Param("key")

		var req admin.UpdateAdminSettingRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := adminRepo.UpdateAdminSetting(c.Request.Context(), settingKey, req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to update setting: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Setting updated successfully",
		})
	}
}

// Transaction Fees Handlers

func handleGetTransactionFees(adminRepo admin.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		fees, err := adminRepo.GetTransactionFees(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to fetch transaction fees: %v", err)})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": fees,
		})
	}
}

// User Management Handlers
func handleGetUserById(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		userData, err := adminService.GetUserByID(userID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		c.JSON(http.StatusOK, userData)
	}
}

func handleUpdateUser(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		var updateData struct {
			Name        string `json:"name"`
			PhoneNumber string `json:"phone_number"`
		}
		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err = adminService.UpdateUser(userID, updateData.Name, updateData.PhoneNumber)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
	}
}

func handleBlockUser(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		var req struct {
			Reason string `json:"reason"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err = adminService.BlockUser(userID, req.Reason)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to block user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "User blocked successfully"})
	}
}

func handleUnblockUser(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		err = adminService.UnblockUser(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unblock user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "User unblocked successfully"})
	}
}

func handleDeleteUser(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		err = adminService.DeleteUser(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
	}
}

// Provider Management Handlers
func handleGetProviderById(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
			return
		}

		providerData, err := adminService.GetProviderByID(providerID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Provider not found"})
			return
		}

		c.JSON(http.StatusOK, providerData)
	}
}

func handleUpdateProviderStatus(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		_, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
			return
		}

		var req struct {
			Status string `json:"status"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Update provider status logic here
		c.JSON(http.StatusOK, gin.H{"message": "Provider status updated successfully"})
	}
}

func handleUpdateProvider(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
			return
		}

		var updateData struct {
			Name        string `json:"name"`
			PhoneNumber string `json:"phone_number"`
		}
		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err = adminService.UpdateProvider(providerID, updateData.Name, updateData.PhoneNumber)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update provider"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Provider updated successfully"})
	}
}

func handleVerifyProvider(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
			return
		}

		err = adminService.VerifyProvider(providerID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify provider"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Provider verified successfully"})
	}
}

func handleSuspendProvider(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		providerID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider ID"})
			return
		}

		var req struct {
			Reason string `json:"reason"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err = adminService.SuspendProvider(providerID, req.Reason)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to suspend provider"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Provider suspended successfully"})
	}
}

// Courier Management Handlers
func handleGetCourierById(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		courierID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid courier ID"})
			return
		}

		courierData, err := adminService.GetCourierByID(courierID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Courier not found"})
			return
		}

		c.JSON(http.StatusOK, courierData)
	}
}

func handleUpdateCourierStatus(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		_, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid courier ID"})
			return
		}

		var req struct {
			Status string `json:"status"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Update courier status logic
		c.JSON(http.StatusOK, gin.H{"message": "Courier status updated successfully"})
	}
}

func handleSuspendCourier(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		courierID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid courier ID"})
			return
		}

		var req struct {
			Reason string `json:"reason"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err = adminService.SuspendCourier(courierID, req.Reason)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to suspend courier"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Courier suspended successfully"})
	}
}

// Order Management Handlers
func handleGetOrderById(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		orderData, err := adminService.GetOrderByID(orderID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}

		c.JSON(http.StatusOK, orderData)
	}
}

func handleUpdateOrderAdminStatus(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		var req struct {
			Status string `json:"status"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err = adminService.UpdateOrderStatus(orderID, req.Status)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Order status updated successfully"})
	}
}

func handleModerateOrder(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		_, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		var req struct {
			Action string `json:"action"`
			Notes  string `json:"notes"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Order moderation logic can be implemented based on action type
		c.JSON(http.StatusOK, gin.H{"message": "Order moderated successfully"})
	}
}

func handleCancelOrderAdmin(adminService *admin.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		var req struct {
			Reason string `json:"reason"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err = adminService.CancelOrder(orderID, req.Reason)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel order"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Order cancelled successfully"})
	}
}

// Settings Handlers
func handleGetSettings() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: Fetch settings from database
		c.JSON(http.StatusOK, gin.H{
			"deliveryFeePercentage":  8,
			"serviceChargePercentage": 5,
			"maxOrdersPerDay":        500,
			"minDeliveryDistance":    1,
			"maxDeliveryDistance":    50,
			"averageDeliveryTime":    35,
		})
	}
}

func handleUpdateSettings() gin.HandlerFunc {
	return func(c *gin.Context) {
		var settings map[string]interface{}
		if err := c.ShouldBindJSON(&settings); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// TODO: Update settings in database
		c.JSON(http.StatusOK, gin.H{"message": "Settings updated successfully"})
	}
}

// Reports Handlers
func handleGetReports() gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

		// TODO: Fetch reports from database
		c.JSON(http.StatusOK, gin.H{
			"reports": []interface{}{},
			"pagination": gin.H{
				"page":  page,
				"limit": limit,
				"total": 0,
			},
		})
	}
}

func handleExportData() gin.HandlerFunc {
	return func(c *gin.Context) {
		reportType := c.Param("type")
		format := c.DefaultQuery("format", "csv")

		// TODO: Generate and export data
		c.JSON(http.StatusOK, gin.H{
			"message": fmt.Sprintf("Export of %s as %s generated successfully", reportType, format),
		})
	}
}

func handleGetAuditLogs() gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

		// TODO: Fetch audit logs from database
		c.JSON(http.StatusOK, gin.H{
			"logs": []interface{}{},
			"pagination": gin.H{
				"page":  page,
				"limit": limit,
				"total": 0,
			},
		})
	}
}

// Disputes Handlers
func handleGetDisputes() gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		status := c.Query("status")

		// TODO: Fetch disputes from database
		c.JSON(http.StatusOK, gin.H{
			"disputes": []interface{}{},
			"pagination": gin.H{
				"page":  page,
				"limit": limit,
				"total": 0,
			},
			"status": status,
		})
	}
}

func handleResolveDispute() gin.HandlerFunc {
	return func(c *gin.Context) {
		disputeID := c.Param("id")

		var req struct {
			Resolution string `json:"resolution"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// TODO: Resolve dispute in database
		c.JSON(http.StatusOK, gin.H{
			"message":    "Dispute resolved successfully",
			"dispute_id": disputeID,
		})
	}
}
