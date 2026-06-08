# API Spec Analysis

현재 워크스페이스 `D:\eodigatji\eodigatji-be` 의 코드 기준으로 정리한 API 스펙 문서입니다.

- 기준 일시: 2026-06-08
- 기준 범위: 현재 로컬 코드베이스
- 베이스 경로: `/v1`
- Swagger 경로: `/swagger-ui.html`
- OpenAPI Docs 경로: `/v3/api-docs`

## 인증 정책

- 인증 없이 호출 가능
  - `POST /v1/auth/email/send`
  - `POST /v1/auth/email/verify`
  - `POST /v1/auth/signup`
  - `POST /v1/auth/login`
  - `POST /v1/auth/reissue`
- 그 외 API는 모두 JWT 인증 필요
  - 헤더: `Authorization: Bearer {accessToken}`
- 기본 토큰 만료 시간
  - Access Token: `3600000ms` (1시간)
  - Refresh Token: `1209600000ms` (14일)

근거 코드:

- `src/main/java/eodigatji/eodigatjiserver/auth/config/SecurityConfig.java`
- `src/main/java/eodigatji/eodigatjiserver/auth/jwt/JwtAuthenticationFilter.java`
- `src/main/resources/application.properties`

## 1. Auth

기준 코드:

- `src/main/java/eodigatji/eodigatjiserver/auth/controller/AuthController.java`
- `src/main/java/eodigatji/eodigatjiserver/auth/service/AuthService.java`
- `src/main/java/eodigatji/eodigatjiserver/auth/service/MailService.java`

### POST /v1/auth/email/send

설명:

- 이메일 인증번호 발송
- 강남대학교 이메일만 허용

요청:

```json
{
  "email": "user@kangnam.ac.kr"
}
```

검증:

- `email`: 필수
- 이메일 형식 필수
- 도메인 `kangnam.ac.kr` 만 허용
- 이미 가입된 이메일이면 실패

응답:

- `200 OK`
- 바디 없음

가능한 실패:

- `400 Bad Request`: 이메일 형식 오류, 학교 이메일 아님
- `409 Conflict`: 이미 가입된 이메일

### POST /v1/auth/email/verify

설명:

- 이메일 인증번호 검증

요청:

```json
{
  "email": "user@kangnam.ac.kr",
  "code": "123456"
}
```

검증:

- `email`: 필수, 이메일 형식
- `code`: 필수, 6자리 숫자

응답:

- `200 OK`
- 바디 없음

가능한 실패:

- `400 Bad Request`: 인증 정보 없음, 인증번호 불일치, 인증번호 만료

### POST /v1/auth/signup

설명:

- 회원가입
- 사전 이메일 인증 완료 필요

요청:

```json
{
  "email": "user@kangnam.ac.kr",
  "password": "password123",
  "studentNumber": "20231234",
  "nickname": "hong"
}
```

검증:

- `email`: 필수, 이메일 형식
- `password`: 필수, 8자 이상 255자 이하
- `studentNumber`: 필수, 20자 이하
- `nickname`: 필수, 30자 이하

응답:

- `201 Created`
- 바디 없음

가능한 실패:

- `400 Bad Request`: 인증 정보 없음, 이메일 인증 미완료, 인증번호 만료
- `409 Conflict`: 이미 가입된 이메일

비고:

- 현재 구현은 `nickname`, `studentNumber` 중복을 서비스에서 검사하지 않음

### POST /v1/auth/login

설명:

- 로그인

요청:

```json
{
  "email": "user@kangnam.ac.kr",
  "password": "password123"
}
```

응답:

- `200 OK`

```json
{
  "tokenType": "Bearer",
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

가능한 실패:

- `401 Unauthorized`: 이메일 또는 비밀번호 불일치

### POST /v1/auth/reissue

설명:

- Refresh Token 기반 토큰 재발급

요청:

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

응답:

- `200 OK`

```json
{
  "tokenType": "Bearer",
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

가능한 실패:

- `400 Bad Request`: refresh token 누락
- `401 Unauthorized`: 유효하지 않음, 저장되지 않음, 만료됨, 사용자 정보 없음

## 2. Locations

기준 코드:

- `src/main/java/eodigatji/eodigatjiserver/location/controller/LocationController.java`
- `src/main/java/eodigatji/eodigatjiserver/location/service/LocationService.java`
- `src/main/java/eodigatji/eodigatjiserver/location/dto/LocationRequest.java`
- `src/main/java/eodigatji/eodigatjiserver/location/dto/LocationPatchRequest.java`
- `src/main/java/eodigatji/eodigatjiserver/location/dto/LocationResponse.java`

### GET /v1/locations

설명:

- 보관 장소 목록 조회

응답:

- `200 OK`

```json
[
  {
    "id": 1,
    "name": "보관함 A",
    "detail": "학생회관 1층",
    "number": "A-01",
    "createdAt": "2026-06-08T12:34:56"
  }
]
```

정렬:

- `id` 내림차순

### GET /v1/locations/{id}

설명:

- 보관 장소 상세 조회

응답:

- `200 OK`

```json
{
  "id": 1,
  "name": "보관함 A",
  "detail": "학생회관 1층",
  "number": "A-01",
  "createdAt": "2026-06-08T12:34:56"
}
```

### POST /v1/locations

설명:

- 보관 장소 등록

요청:

```json
{
  "name": "보관함 A",
  "detail": "학생회관 1층",
  "number": "A-01"
}
```

검증:

- `name`: 필수, 100자 이하
- `detail`: 필수, 255자 이하
- `number`: 필수, 20자 이하

응답:

- `201 Created`

```json
{
  "id": 1,
  "name": "보관함 A",
  "detail": "학생회관 1층",
  "number": "A-01",
  "createdAt": "2026-06-08T12:34:56"
}
```

### PATCH /v1/locations/{id}

설명:

- 보관 장소 부분 수정

요청:

```json
{
  "name": "보관함 B",
  "detail": "학생회관 2층",
  "number": "B-02"
}
```

검증:

- `name`: 선택, 100자 이하
- `detail`: 선택, 255자 이하
- `number`: 선택, 20자 이하
- 세 필드 중 최소 1개 필요
- 값이 들어오면 blank 문자열 불가

응답:

- `200 OK`

```json
{
  "id": 1,
  "name": "보관함 B",
  "detail": "학생회관 2층",
  "number": "B-02",
  "createdAt": "2026-06-08T12:34:56"
}
```

### DELETE /v1/locations/{id}

설명:

- 보관 장소 삭제

응답:

- `204 No Content`

## 3. Comments

기준 코드:

- `src/main/java/eodigatji/eodigatjiserver/comment/controller/CommentController.java`
- `src/main/java/eodigatji/eodigatjiserver/comment/service/CommentService.java`
- `src/main/java/eodigatji/eodigatjiserver/comment/dto/CommentRequestDto.java`
- `src/main/java/eodigatji/eodigatjiserver/comment/dto/CommentResponseDto.java`

### GET /v1/posts/{postId}/comments

설명:

- 게시글 댓글 목록 조회

응답:

- `200 OK`

```json
[
  {
    "commentId": 1,
    "userId": 1,
    "content": "댓글 내용",
    "createdAt": "2026-06-08T12:34:56"
  }
]
```

### POST /v1/posts/{postId}/comments

설명:

- 댓글 작성

요청:

```json
{
  "userId": 1,
  "content": "댓글 내용"
}
```

응답:

- 현재 구현 기준 `200 OK`
- 바디 없음

비고:

- 인증은 JWT로 걸려 있지만 작성자는 JWT 사용자 대신 요청 바디의 `userId` 로 결정됨
- `@Valid` 검증이 없어서 `content` 공백, null 등에 대한 명시적 검증이 없음

### DELETE /v1/posts/{postId}/comments/{commentId}

설명:

- 댓글 삭제

응답:

- 현재 구현 기준 `200 OK`
- 바디 없음

비고:

- `commentId` 는 존재해야 함
- 댓글의 `postId` 가 URL의 `postId` 와 일치해야 삭제 가능

## 4. Search

기준 코드:

- `src/main/java/eodigatji/eodigatjiserver/search/controller/SearchController.java`
- `src/main/java/eodigatji/eodigatjiserver/search/service/SearchService.java`
- `src/main/java/eodigatji/eodigatjiserver/search/dto/SearchResponseDto.java`

### GET /v1/posts/search?keyword={keyword}

설명:

- 키워드 검색

쿼리 파라미터:

- `keyword`: string

응답 타입:

```json
[
  {
    "postId": 1,
    "locationId": 1,
    "title": "분실물 제목",
    "description": "설명",
    "type": "LOST",
    "category": "ELECTRONICS"
  }
]
```

### GET /v1/posts/categories/{category}

설명:

- 카테고리 검색

응답 타입:

```json
[
  {
    "postId": 1,
    "locationId": 1,
    "title": "분실물 제목",
    "description": "설명",
    "type": "LOST",
    "category": "ELECTRONICS"
  }
]
```

### GET /v1/posts/search/date?date={date}

설명:

- 날짜 검색

쿼리 파라미터:

- `date`: string

응답 타입:

```json
[
  {
    "postId": 1,
    "locationId": 1,
    "title": "분실물 제목",
    "description": "설명",
    "type": "LOST",
    "category": "ELECTRONICS"
  }
]
```

### GET /v1/posts/search/place?place={place}

설명:

- 장소 검색

쿼리 파라미터:

- `place`: string

응답 타입:

```json
[
  {
    "postId": 1,
    "locationId": 1,
    "title": "분실물 제목",
    "description": "설명",
    "type": "LOST",
    "category": "ELECTRONICS"
  }
]
```

중요:

- 현재 `SearchService` 는 모든 메서드가 `List.of()` 를 반환하므로 실제 응답은 항상 빈 배열
- 관련 게시글 도메인과 리포지토리 구현이 아직 없음

## 공통 응답 DTO 요약

### TokenResponse

```json
{
  "tokenType": "Bearer",
  "accessToken": "string",
  "refreshToken": "string"
}
```

### LocationResponse

```json
{
  "id": 1,
  "name": "string",
  "detail": "string",
  "number": "string",
  "createdAt": "2026-06-08T12:34:56"
}
```

### CommentResponseDto

```json
{
  "commentId": 1,
  "userId": 1,
  "content": "string",
  "createdAt": "2026-06-08T12:34:56"
}
```

### SearchResponseDto

```json
{
  "postId": 1,
  "locationId": 1,
  "title": "string",
  "description": "string",
  "type": "string",
  "category": "string"
}
```

## 현재 구현상 주의사항

- `search` API 는 명세만 있고 실제 구현은 없음
- `comment` API 는 게시글 엔티티와 연관관계 없이 `postId` 숫자만 저장
- `comment` 작성자는 JWT 인증 사용자와 무관하게 요청 바디의 `userId` 에 의존
- 전역 예외 처리기가 없어 `IllegalArgumentException`, `LocationNotFoundException` 이 일관된 4xx 응답으로 변환되지 않을 수 있음
- `signup` 은 이메일 중복만 막고 `nickname`, `studentNumber` 중복은 현재 검사하지 않음

## 최신성 범위

이 문서는 다음 의미에서 최신입니다.

- 현재 로컬 워크스페이스 코드 기준 최신

이 문서는 다음까지 보장하지는 않습니다.

- 서버 실행 후 실제 HTTP 호출 결과 검증
- 원격 저장소 최신 커밋 반영 여부
- 운영 DB 상태 반영
- Swagger 생성 결과와의 완전 일치 검증
