# Shopping Mall Demo Server

Node.js, Express, MongoDB를 사용한 쇼핑몰 데모 서버입니다.

## 설치 방법

1. 의존성 패키지 설치
```bash
npm install
```

2. 환경 변수 설정
```bash
# .env.example을 .env로 복사하고 필요한 값 설정
cp .env.example .env
```

3. 서버 실행
```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

## 프로젝트 구조

```
server/
├── config/          # 설정 파일
│   └── database.js  # MongoDB 연결 설정
├── models/          # Mongoose 모델
│   └── index.js     # 사용자 모델 예제
├── routes/          # API 라우트
│   └── index.js     # 기본 라우트
├── middleware/      # 미들웨어 (필요시)
├── controllers/     # 컨트롤러 (필요시)
├── index.js         # 서버 진입점
├── package.json     # 프로젝트 설정
└── .env            # 환경 변수 (생성 필요)
```

## 주요 기능

- ✅ Express 서버 설정
- ✅ MongoDB 연결 및 관리
- ✅ CORS 설정
- ✅ Body Parser 설정
- ✅ 기본 라우트 설정
- ✅ 환경 변수 관리 (dotenv)

## API 엔드포인트

- `GET /` - 서버 정보
- `GET /health` - 서버 상태 확인

## 필요한 환경 변수

- `MONGO_URI`: MongoDB 연결 문자열
- `PORT`: 서버 포트 (기본값: 3000)

## 다음 단계

1. MongoDB 설치 및 실행
2. 필요한 모델 추가 (상품, 주문 등)
3. 인증 기능 구현
4. API 엔드포인트 추가

