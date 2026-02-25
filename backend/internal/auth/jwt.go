package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	// Hardcoded for LOCAL DEV ONLY - never commit
	jwtSecret = []byte("super-secret-key-change-this-immediately-2026")
)

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