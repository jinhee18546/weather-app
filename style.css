/*
  기본 페이지 스타일
  - 화면 중앙 정렬
  - 모바일에서도 깨지지 않도록 폭을 유연하게 처리
*/
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #e0f2fe, #f8fafc);
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: #0f172a;
}

.app {
  width: min(94%, 560px);
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

h1 {
  margin: 0 0 6px;
  font-size: 1.5rem;
}

.subtitle {
  margin: 0 0 16px;
  color: #475569;
  line-height: 1.45;
  font-size: 0.95rem;
}

.search-area {
  display: grid;
  gap: 8px;
}

label {
  font-weight: 700;
}

/*
  자동완성 입력 래퍼
  - dropdown이 input 바로 아래 오도록 기준 위치(relative)
*/
.autocomplete-wrapper {
  position: relative;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 1rem;
}

input:focus {
  outline: 2px solid #bfdbfe;
  border-color: #3b82f6;
}

button {
  padding: 11px 12px;
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: white;
  font-size: 1rem;
  cursor: pointer;
}

button:hover {
  background: #1d4ed8;
}

/*
  자동완성 목록
  - 기본은 숨김(display:none)
  - JS에서 항목이 있을 때만 표시
*/
.autocomplete-list {
  display: none;
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 6px;
  list-style: none;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  max-height: 230px;
  overflow-y: auto;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.15);
  z-index: 20;
}

.autocomplete-item {
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1.35;
}

.autocomplete-item:hover,
.autocomplete-item.active {
  background: #eff6ff;
}

.status {
  min-height: 20px;
  margin: 10px 0 6px;
  color: #1d4ed8;
  font-size: 0.92rem;
}

.error {
  display: none;
  margin: 0 0 12px;
  color: #b91c1c;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px;
}

.weather-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
}

.weather-card h2 {
  margin: 0 0 12px;
  font-size: 1.1rem;
}

/*
  날씨 정보를 2열 그리드로 표시
  모바일에서는 1열로 자동 전환
*/
.weather-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.weather-grid p {
  margin: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.weather-grid strong {
  font-size: 0.86rem;
  color: #475569;
}

.weather-grid span {
  font-size: 1rem;
  font-weight: 700;
}

@media (max-width: 520px) {
  .app {
    padding: 16px;
  }

  .weather-grid {
    grid-template-columns: 1fr;
  }
}
