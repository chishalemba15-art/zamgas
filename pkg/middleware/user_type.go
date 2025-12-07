package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/yakumwamba/lpg-delivery-system/internal/user"
)

func UserTypeMiddleware(userType user.UserType) gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: Check user type from context and allow/deny access
		c.Next()
	}
}
