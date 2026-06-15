# Eodigatji API Spec

This document describes the current API behavior based on the source code in this repository.
It documents the implementation as-is, including incomplete validation and inconsistent error handling.

## Overview

- Base path: `/v1`
- Swagger UI: `/swagger-ui.html`
- OpenAPI JSON: `/v3/api-docs`
- Default request/response format: `application/json`
- Post create/update and image upload use `multipart/form-data`

## Authentication

All endpoints require JWT authentication except:

- `POST /v1/auth/email/send`
- `POST /v1/auth/email/verify`
- `POST /v1/auth/signup`
- `POST /v1/auth/login`
- `POST /v1/auth/reissue`
- Swagger/OpenAPI routes under `/swagger-ui/**`, `/swagger-ui.html`, `/v3/api-docs/**`

Auth header format:

```http
Authorization: Bearer {accessToken}
```

## Important implementation notes

- Error response formats are not consistent across the API.
- `IllegalArgumentException` is handled as `400 Bad Request` with a plain string body.
- `ResponseStatusException` and validation failures use Spring default error responses.
- `LocationNotFoundException` is not handled explicitly, so missing locations currently surface as `500 Internal Server Error`.
- If an `Authorization` header is present but malformed or the access token is invalid, `JwtAuthenticationFilter` returns `401 Unauthorized` with:

```json
{
  "message": "Unauthorized"
}
```

- Email addresses are normalized with `trim().toLowerCase()` before auth flows use them.
- Email verification uses the most recent verification record for the email.
- Verification codes expire after 5 minutes.
- Default JWT expirations from `application.properties` are 1 hour for access tokens and 14 days for refresh tokens.
- Uploaded post images are stored under `uploads/posts` and the API returns relative URLs like `/posts/{filename}`.
- There is no resource handler in this repository that serves `/posts/**`.
- Post create/update DTOs do not use Bean Validation annotations. Missing required fields can fail later at the persistence layer.
- `PATCH /v1/posts/{postId}` behaves like a full overwrite of mutable fields, not a safe partial update.
- Post update and delete require authentication, but there is no ownership check.
- Comment create and delete require authentication, but there is no ownership check.
- Comment create still trusts `userId` from the request body instead of the authenticated user.
- Comment create does not verify that the target post exists.

## Enums

### PostType

- `LOST`
- `FOUND`

### PostCategory

- `ELECTRONICS`
- `WALLET`
- `FASHION`
- `BOOK`
- `ETC`

## Auth APIs

### POST /v1/auth/email/send

Send a verification code to a school email address.

- Auth: none
- Request body

```json
{
  "email": "user@kangnam.ac.kr"
}
```

- Validation
  - `email`: required, valid email format
- Response
  - `200 OK`
  - empty body
- Status codes
  - `400 Bad Request`: invalid email format, non-`kangnam.ac.kr` address
  - `409 Conflict`: email already registered

### POST /v1/auth/email/verify

Verify the latest email verification code for an email address.

- Auth: none
- Request body

```json
{
  "email": "user@kangnam.ac.kr",
  "code": "123456"
}
```

- Validation
  - `email`: required, valid email format
  - `code`: required, 6 digits
- Response
  - `200 OK`
  - empty body
- Status codes
  - `400 Bad Request`: verification record missing, code mismatch, or code expired

### POST /v1/auth/signup

Create a new user.

- Auth: none
- Request body

```json
{
  "email": "user@kangnam.ac.kr",
  "password": "password123",
  "studentNumber": "20231234",
  "nickname": "honggildong"
}
```

- Validation
  - `email`: required, valid email format
  - `password`: required, 8 to 255 chars
  - `studentNumber`: required, max 20 chars
  - `nickname`: required, max 30 chars
- Response
  - `201 Created`
  - empty body
- Status codes
  - `400 Bad Request`: email not verified, verification record missing, verification expired, invalid school domain
  - `409 Conflict`: email already registered
- Notes
  - initial user temperature is `36`
  - there is no service-level uniqueness check for nickname or student number

### POST /v1/auth/login

Log in and issue tokens.

- Auth: none
- Request body

```json
{
  "email": "user@kangnam.ac.kr",
  "password": "password123"
}
```

- Response

```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

- Status codes
  - `200 OK`
  - `401 Unauthorized`: invalid email or password

### POST /v1/auth/reissue

Reissue tokens from a refresh token.

- Auth: none
- Request body

```json
{
  "refreshToken": "eyJ..."
}
```

- Response

```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

- Status codes
  - `200 OK`
  - `400 Bad Request`: blank token or validation failure
  - `401 Unauthorized`: invalid, expired, unknown, or user-mismatched refresh token

## Post APIs

### POST /v1/posts

Create a post.

- Auth: required
- Content-Type: `multipart/form-data`
- Request parts
  - `request`: JSON
  - `images`: repeated file parts, optional
- `request` JSON example

```json
{
  "title": "Lost wallet",
  "description": "Lost near student hall",
  "type": "LOST",
  "category": "WALLET",
  "locationId": 1
}
```

- Response
  - `200 OK`
  - body is the created post ID

```json
1
```

- Notes
  - `userId` comes from the JWT access token
  - the controller redundantly checks that the `Authorization` header starts with `Bearer `
  - request fields are not validated at controller level

### GET /v1/posts/{postId}

Get post detail.

- Auth: required
- Path params
  - `postId`: `Long`
- Response

```json
{
  "id": 1,
  "title": "Lost wallet",
  "description": "Lost near student hall",
  "type": "LOST",
  "category": "WALLET",
  "locationId": 1,
  "userId": 3,
  "imageUrls": [
    "/posts/example1.png",
    "/posts/example2.png"
  ],
  "createdAt": "2026-06-13T11:30:00"
}
```

- Status codes
  - `200 OK`
  - `400 Bad Request`: post not found

### GET /v1/posts

Get a paged post list.

- Auth: required
- Query params
  - `page`: default `0`
  - `size`: default `10`
  - `sort`: default `createdAt,DESC`
- Response
  - `200 OK`
  - body type: Spring `Page<PostListResponse>`

Example response shape:

```json
{
  "content": [
    {
      "id": 1,
      "title": "Lost wallet",
      "type": "LOST",
      "thumbnailImageUrl": "/posts/example1.png",
      "createdAt": "2026-06-13T11:30:00"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "size": 10,
  "number": 0
}
```

- Notes
  - `thumbnailImageUrl` is the first image URL or `null`
  - additional standard Spring Page fields are included

### PATCH /v1/posts/{postId}

Update a post.

- Auth: required
- Content-Type: `multipart/form-data`
- Path params
  - `postId`: `Long`
- Request parts
  - `request`: JSON
  - `images`: repeated file parts, optional
- `request` JSON example

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "category": "ETC",
  "locationId": 2,
  "type": "FOUND"
}
```

- Response
  - `200 OK`
  - empty body
- Status codes
  - `400 Bad Request`: post not found
- Notes
  - despite using `PATCH`, the implementation overwrites all mutable fields with the request values
  - send all of `title`, `description`, `category`, `locationId`, and `type`
  - if new images are provided, existing image files are deleted and replaced
  - if no new images are provided, existing image URLs stay unchanged
  - omitted or null required fields can produce persistence errors
  - there is no owner check

### DELETE /v1/posts/{postId}

Delete a post.

- Auth: required
- Path params
  - `postId`: `Long`
- Response
  - `200 OK`
  - empty body
- Status codes
  - `400 Bad Request`: post not found
- Notes
  - image files are also deleted
  - there is no owner check

### POST /v1/posts/images

Upload one image.

- Auth: required
- Content-Type: `multipart/form-data`
- Request parts
  - `image`: single file
- Response

```json
{
  "imageUrl": "/posts/example.png"
}
```

- Status codes
  - `200 OK`
  - `400 Bad Request`: missing file, empty file, invalid filename, or non-image file

## Comment APIs

### GET /v1/posts/{postId}/comments

Get comments for a post.

- Auth: required
- Path params
  - `postId`: `Long`
- Response

```json
[
  {
    "commentId": 1,
    "userId": 3,
    "content": "I think I saw it.",
    "createdAt": "2026-06-13T12:00:00"
  }
]
```

- Notes
  - the service does not verify that the post exists
  - if the post has no comments, the response is `[]`

### POST /v1/posts/{postId}/comments

Create a comment.

- Auth: required
- Path params
  - `postId`: `Long`
- Request body

```json
{
  "userId": 3,
  "content": "I think I saw it."
}
```

- Response
  - `200 OK`
  - empty body
- Status codes
  - `400 Bad Request`: user not found
- Notes
  - `postId` is stored directly and the service does not verify that the post exists
  - the implementation does not verify that request `userId` matches the authenticated user
  - `content` is not validated for blank or length

### DELETE /v1/posts/{postId}/comments/{commentId}

Delete a comment.

- Auth: required
- Path params
  - `postId`: `Long`
  - `commentId`: `Long`
- Response
  - `200 OK`
  - empty body
- Status codes
  - `400 Bad Request`: comment not found or comment does not belong to the given post
- Notes
  - there is no owner check

## Search APIs

All search routes are implemented and return `List<SearchResponseDto>`.

Common response item shape:

```json
{
  "postId": 1,
  "locationId": 1,
  "title": "Title",
  "description": "Description",
  "type": "LOST",
  "category": "WALLET"
}
```

### GET /v1/posts/search

Search posts by title or description keyword.

- Auth: required
- Query params
  - `keyword`: string
- Status codes
  - `200 OK`
  - `400 Bad Request`: blank keyword

### GET /v1/posts/categories/{category}

Search posts by category.

- Auth: required
- Path params
  - `category`: string
- Notes
  - category matching is case-insensitive in the service
- Status codes
  - `200 OK`
  - `400 Bad Request`: unknown category

### GET /v1/posts/search/date

Search posts by creation date.

- Auth: required
- Query params
  - `date`: string in `yyyy-MM-dd` format
- Status codes
  - `200 OK`
  - `400 Bad Request`: blank or invalid date format

### GET /v1/posts/search/place

Search posts by location name.

- Auth: required
- Query params
  - `place`: string
- Notes
  - this searches `location.name` only
  - matched location IDs are then used to find posts
  - if no locations match, the response is `[]`
- Status codes
  - `200 OK`
  - `400 Bad Request`: blank place

## Location APIs

### GET /v1/locations

Get location list.

- Auth: required
- Response

```json
[
  {
    "id": 1,
    "name": "Locker A",
    "detail": "Student Hall 1F",
    "number": "A-01",
    "latitude": 37.5665,
    "longitude": 126.978,
    "createdAt": "2026-06-13T10:00:00"
  }
]
```

- Notes
  - results are ordered by `id DESC`

### GET /v1/locations/{id}

Get location detail.

- Auth: required
- Path params
  - `id`: `Long`
- Response
  - `200 OK`
  - same shape as one item from list API
- Status codes
  - `500 Internal Server Error`: location not found, due to unhandled `LocationNotFoundException`

### POST /v1/locations

Create a location.

- Auth: required
- Request body

```json
{
  "name": "Locker A",
  "detail": "Student Hall 1F",
  "number": "A-01",
  "latitude": 37.5665,
  "longitude": 126.978
}
```

- Validation
  - `name`: required, max 100 chars
  - `detail`: required, max 255 chars
  - `number`: required, max 20 chars
  - `latitude`: optional, `-90.0` to `90.0`
  - `longitude`: optional, `-180.0` to `180.0`
- Response
  - `201 Created`
  - body: `LocationResponse`
- Status codes
  - `400 Bad Request`: validation failure

### PATCH /v1/locations/{id}

Partially update a location.

- Auth: required
- Path params
  - `id`: `Long`
- Request body

```json
{
  "name": "Locker B",
  "latitude": 37.567,
  "longitude": 126.979
}
```

- Validation
  - `name`: optional, max 100 chars
  - `detail`: optional, max 255 chars
  - `number`: optional, max 20 chars
  - `latitude`: optional, `-90.0` to `90.0`
  - `longitude`: optional, `-180.0` to `180.0`
- Response
  - `200 OK`
  - body: updated `LocationResponse`
- Status codes
  - `400 Bad Request`: every field is null, blank string supplied for `name`/`detail`/`number`, or validation failure
  - `500 Internal Server Error`: location not found
- Notes
  - coordinate-only updates are allowed
  - null fields are ignored

### DELETE /v1/locations/{id}

Delete a location.

- Auth: required
- Path params
  - `id`: `Long`
- Response
  - `204 No Content`
- Status codes
  - `500 Internal Server Error`: location not found

## My Page APIs

### GET /v1/mypage

Get current user profile summary.

- Auth: required
- Response

```json
{
  "email": "user@kangnam.ac.kr",
  "nickname": "honggildong",
  "studentNumber": "20231234",
  "temperature": 36
}
```

- Status codes
  - `200 OK`
  - `404 Not Found`: user not found

### GET /v1/mypage/comments

Get comments written by the current user.

- Auth: required
- Response

```json
[
  {
    "commentId": 1,
    "content": "I think I saw it."
  }
]
```

### GET /v1/mypage/temperature

Get current user temperature.

- Auth: required
- Response

```json
{
  "temperature": 36
}
```

- Status codes
  - `200 OK`
  - `404 Not Found`: user not found

### GET /v1/mypage/posts

Get posts written by the current user.

- Auth: required
- Response

```json
[
  {
    "postId": 1,
    "title": "Lost wallet"
  }
]
```
