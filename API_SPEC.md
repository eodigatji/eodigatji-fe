# Eodigatji API Spec

This document describes the current API behavior based on the source code in this repository.
It documents the implementation as-is, including incomplete features and inconsistent error shapes.

## Overview

- Base path: `/v1`
- Swagger UI: `/swagger-ui.html`
- JSON APIs use `application/json`
- Post create/update and image upload use `multipart/form-data`

## Authentication

All endpoints require JWT authentication except:

- `POST /v1/auth/email/send`
- `POST /v1/auth/email/verify`
- `POST /v1/auth/signup`
- `POST /v1/auth/login`
- `POST /v1/auth/reissue`

Auth header format:

```http
Authorization: Bearer {accessToken}
```

## Important implementation notes

- `IllegalArgumentException` is handled as `400 Bad Request` with a plain string body.
- `ResponseStatusException` and validation failures use Spring default error responses.
- Error response formats are not consistent across the API.
- All 4 search endpoints currently return `[]` because the service methods are stubs.
- Post update and delete require authentication, but there is no ownership check in the current implementation.
- Comment create requires authentication, but it still takes `userId` from the request body instead of using the authenticated user.
- Uploaded post images are stored under `uploads/posts` and returned as relative URLs like `/posts/{filename}`.

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
- Notes
  - only `kangnam.ac.kr` is allowed
  - already registered email returns `409 Conflict`

### POST /v1/auth/email/verify

Verify an email verification code.

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
- Notes
  - a verified email record must exist
  - expired or unverified email verification returns `400 Bad Request`
  - already registered email returns `409 Conflict`
  - initial temperature is `36`

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
  - invalid email or password: `401 Unauthorized`

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
  - empty token: `400 Bad Request`
  - invalid, expired, or unknown token: `401 Unauthorized`

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
  - controller also manually checks that `Authorization` starts with `Bearer `

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
  - post not found: `400 Bad Request`

### GET /v1/posts

Get paged post list.

- Auth: required
- Query params
  - `page`: default `0`
  - `size`: default `10`
  - `sort`: default `createdAt,DESC`
- Response
  - `200 OK`
  - body type: Spring `Page<PostListResponse>`

Example `content`:

```json
[
  {
    "id": 1,
    "title": "Lost wallet",
    "type": "LOST",
    "thumbnailImageUrl": "/posts/example1.png",
    "createdAt": "2026-06-13T11:30:00"
  }
]
```

- Notes
  - `thumbnailImageUrl` is the first image URL or `null`

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
- Notes
  - if new images are provided, existing image files are deleted and replaced
  - if no new images are provided, existing image URLs stay unchanged
  - there is no owner check

### DELETE /v1/posts/{postId}

Delete a post.

- Auth: required
- Path params
  - `postId`: `Long`
- Response
  - `200 OK`
  - empty body
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
  - missing file, empty file, or non-image file: `400 Bad Request`

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
- Notes
  - current implementation does not verify that request `userId` matches the authenticated user

### DELETE /v1/posts/{postId}/comments/{commentId}

Delete a comment.

- Auth: required
- Path params
  - `postId`: `Long`
  - `commentId`: `Long`
- Response
  - `200 OK`
  - empty body

## Search APIs

All search routes exist, but the service implementation is currently empty.
Every endpoint below returns `200 OK` with `[]`.

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

- Auth: required
- Query params
  - `keyword`: string
- Current behavior
  - `200 OK`
  - `[]`

### GET /v1/posts/categories/{category}

- Auth: required
- Path params
  - `category`: string
- Current behavior
  - `200 OK`
  - `[]`

### GET /v1/posts/search/date

- Auth: required
- Query params
  - `date`: string
- Current behavior
  - `200 OK`
  - `[]`

### GET /v1/posts/search/place

- Auth: required
- Query params
  - `place`: string
- Current behavior
  - `200 OK`
  - `[]`

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

### GET /v1/locations/{id}

Get location detail.

- Auth: required
- Path params
  - `id`: `Long`
- Response
  - `200 OK`
  - same shape as one item from list API

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
- Notes
  - if every field is `null`, returns `400 Bad Request`
  - coordinate-only updates are allowed

### DELETE /v1/locations/{id}

Delete a location.

- Auth: required
- Path params
  - `id`: `Long`
- Response
  - `204 No Content`

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
  - user not found: `404 Not Found`

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
  - user not found: `404 Not Found`

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
