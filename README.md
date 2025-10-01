# Minimal 3D Portfolio

Ultra-minimal portfolio with Three.js + GSAP ScrollTrigger. Lateral 3D sweeps tied to scroll, one accent color, Swiss/Brutalist vibe.

## 폴더 구조

- `index.html` — 메인 페이지 (CDN 사용)
- `assets/css/style.css` — 사이트 스타일 (빌드 없이 바로 사용)
- `assets/scss/style.scss` — SCSS 원본 (원하면 여기서 수정 후 CSS로 복사)
- `assets/js/main.js` — Three.js, GSAP, Lenis 초기화 및 스크롤 애니메이션

## 로컬 실행

빌드 없이 브라우저에서 `index.html` 열면 됩니다.

## GitHub Pages 배포

1. GitHub에 새 리포지토리 생성 후 이 프로젝트를 커밋/푸시합니다.
2. 리포지토리 설정(Settings) → Pages 이동
3. Source: `Deploy from a branch` 선택 → Branch: `main` / Folder: `/ (root)` 선택 → Save
4. 수 분 후 `https://<username>.github.io/<repo>/` 주소로 접속

옵션: 커스텀 도메인을 연결하려면 Pages 설정에서 도메인 추가 후 DNS 설정을 합니다.

## 편집 가이드

- 색상은 `:root`의 CSS 변수에서 하나의 accent 컬러만 사용하세요.
- 모바일 성능 향상을 위해 객체 수(`count`)와 픽셀 비율 제한을 유지하세요.
- SCSS를 사용하려면 별도의 Sass 컴파일러를 사용하거나 결과를 `assets/css/style.css`로 복사하세요.


