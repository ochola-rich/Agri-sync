package auth

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	// Default is for LOCAL DEV ONLY; override via AGRISYNC_JWT_SECRET in real deployments.
	jwtSecret = []byte(getJWTSecret())
)

func getJWTSecret() string {
	if v := os.Getenv("AGRISYNC_JWT_SECRET"); v != "" {
		return v
	}
	return "super-secret-key-change-this-immediately-2026"
}

type Claims struct {
	UserID string `json:"userId"`
	Role   string `json:"role"` // "farmer", "collector", "admin"
	jwt.RegisteredClaims
}

func GenerateJWT(userID, role string) (string, error) {
	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}