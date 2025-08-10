# 🚀 APilot - API Testing Console

> **"Be the pilot of your API requests."**  
> 직관적인 UI와 빠른 반응 속도로 API 요청과 응답을 손쉽게 테스트하세요.


<img width="1275" height="823" alt="image" src="https://github.com/user-attachments/assets/4c0c25f5-12c2-4f83-bf07-e5cdb7ad30c3" />


---

## ✨ 특징

- **다양한 HTTP 메서드 지원**  
  GET, POST, PUT, DELETE 등 모든 HTTP 메서드 테스트 가능
- **실시간 응답 보기**  
  헤더, 바디, 상태 코드까지 한 눈에
- **파라미터 & 헤더 편집**  
  Key-Value 형태로 직관적인 입력
- **CORS 친화적 설계**  
  로컬/외부 서버 모두 테스트 가능
- **다크모드 UI**  
  깔끔하고 눈에 편한 인터페이스

---
🛠 기술 스택
Frontend: React, Vite, TailwindCSS

Backend: Spring Boot (WebFlux), Java 17

Build Tools: Maven, npm

Deployment: Docker, GitHub Actions


## 🖥️ 사용 예시

### 1. GET 요청 보내기
1. 요청 메서드 선택
2. API 엔드포인트 입력  
3. **Send** 클릭 → 결과 확인

### 2. POST 요청
1. `BODY` 탭에서 JSON, Form-Data, Raw 중 선택
2. 요청 데이터 입력
3. **Send** 클릭

---

## 📦 설치 & 실행

```bash
# 1. 프로젝트 클론
git clone https://github.com/min2h/apilot-api-console.git
cd apilot-api-console

# 2. 백엔드 빌드
cd backend
mvn clean package -DskipTests
java -jar target/apilot-backend.jar

# 3. 프론트엔드 실행
cd frontend
npm install
npm run dev
