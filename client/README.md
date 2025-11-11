# Shopping Mall Demo - Client

React + Vite를 사용한 쇼핑몰 데모 클라이언트입니다.

## 설치 방법

1. 의존성 패키지 설치
```bash
npm install
```

2. 개발 서버 실행
```bash
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

3. 프로덕션 빌드
```bash
npm run build
```

4. 빌드 미리보기
```bash
npm run preview
```

## 프로젝트 구조

```
client/
├── public/          # 정적 파일
│   └── vite.svg
├── src/             # 소스 코드
│   ├── App.jsx      # 메인 App 컴포넌트
│   ├── App.css      # App 스타일
│   ├── index.jsx    # 진입점
│   └── index.css    # 전역 스타일
├── index.html       # HTML 템플릿
├── vite.config.js   # Vite 설정
├── package.json     # 프로젝트 설정
└── README.md        # 프로젝트 문서
```

## 주요 기능

- ✅ React 18
- ✅ Vite 5
- ✅ React Router DOM
- ✅ Axios
- ✅ ESLint 설정
- ✅ 개발 서버 프록시 설정 (API 요청 자동 포워딩)

## Vite 설정

- 포트: 5173
- 프록시: `/api` 요청은 `http://localhost:3000`으로 자동 포워딩

## 다음 단계

1. 컴포넌트 구조 설계
2. 라우팅 설정
3. API 연동
4. 상태 관리 추가 (필요시)
5. UI 라이브러리 통합 (필요시)

