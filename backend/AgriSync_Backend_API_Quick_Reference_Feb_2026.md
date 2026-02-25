# AgriSync Backend API -- Quick Reference (Feb 2026)

## Base URL

`http://localhost:8080` (or production host)

## Authentication

Most endpoints require JWT:

    Authorization: Bearer <token>

Token obtained from `POST /auth/login`

------------------------------------------------------------------------

## Public Endpoints

### POST /farmers

Create farmer account

**Body (JSON):**

``` json
{
  "name": "string",
  "phone": "string",
  "password": "string"
}
```

**Success (201):**

``` json
{ 
  "id": "uuid", 
  "name": "...", 
  "phone": "...", 
  "message": "Farmer created successfully" 
}
```

------------------------------------------------------------------------

### POST /collectors

Create collector account

Body: same as `/farmers`

Success (201): similar response

------------------------------------------------------------------------

### POST /auth/login

Authenticate & get JWT

**Body (JSON):**

``` json
{
  "phone": "string",
  "password": "string",
  "role": "farmer | collector | admin"
}
```

**Success (200):**

``` json
{
  "token": "jwt...",
  "userId": "uuid",
  "role": "...",
  "message": "Login successful"
}
```

Errors: - 401 -- Invalid credentials\
- 400 -- Bad request

------------------------------------------------------------------------

### GET /health

Server + DB status

**Success (200):**

``` json
{
  "status": "ok",
  "version": "0.1.0",
  "db": "connected"
}
```

------------------------------------------------------------------------

# Protected Endpoints (Require Bearer Token)

### POST /collections

Create collection (collector/admin only)

**Body (JSON):**

``` json
{
  "farmer_id": "uuid",
  "crop_type": "string",
  "weight_kg": 0,
  "price_per_kg": 0
}
```

**Success (201):**\
Returns full collection object (includes id, status, timestamps, etc.)

------------------------------------------------------------------------

### GET /collections

List collections

-   Farmers → only own\
-   Collectors/Admins → all

**Success (200):**

``` json
{
  "collections": [],
  "count": 0
}
```

------------------------------------------------------------------------

### GET /collections/:id

Get single collection

Farmers can only see their own

**Success (200):**\
Returns collection object

------------------------------------------------------------------------

### PATCH /collections/:id/status

Update status (admin only)

**Body (JSON):**

``` json
{
  "status": "pending | verified | paid"
}
```

**Success (200):**

``` json
{
  "message": "Status updated",
  "id": "uuid"
}
```

------------------------------------------------------------------------

### GET /farmer/history

Authenticated farmer's collection list

**Success (200):**

``` json
{
  "farmer_id": "uuid",
  "collections": [],
  "count": 0,
  "retrieved_at": "ISO timestamp"
}
```

------------------------------------------------------------------------

### GET /farmer/wallet

Authenticated farmer's wallet summary

**Success (200):**

``` json
{
  "farmer_id": "uuid",
  "wallet": {
    "total_pending": 0,
    "total_paid": 0,
    "total_overall": 0,
    "currency": "USD",
    "updated_at": "ISO timestamp"
  }
}
```

------------------------------------------------------------------------

### GET /farmers/:id

Get farmer profile

**Success (200):**

``` json
{
  "farmer": {
    "id": "uuid",
    "name": "string",
    "phone": "string",
    "created_at": "ISO",
    "updated_at": "ISO",
    "version": 0
  }
}
```

------------------------------------------------------------------------

### GET /collectors/:id

Get collector profile

Success (200): similar structure to farmer profile

------------------------------------------------------------------------

# Quick Notes

-   All dates are ISO 8601 strings\
-   UUIDs are strings\
-   Phone numbers must be unique (DB enforced)\
-   Passwords are bcrypt-hashed (never sent back)

## Error Codes

-   401 -- Unauthorized\
-   403 -- Forbidden\
-   404 -- Not found\
-   400 -- Validation error\
-   500 -- Server/DB error

------------------------------------------------------------------------

Happy coding 🚀
