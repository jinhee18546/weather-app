 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/script.js b/script.js
new file mode 100644
index 0000000000000000000000000000000000000000..4827d3522e93994c22ad643da066fc3ca0d0471f
--- /dev/null
+++ b/script.js
@@ -0,0 +1,145 @@
+/*
+  ================================
+  초간단 날씨 앱 (Open-Meteo 사용)
+  ================================
+
+  앱 동작 흐름
+  1) 사용자가 도시명 입력 후 검색 버튼 클릭
+  2) Geocoding API로 도시 좌표(위도/경도) 조회
+  3) 날씨 API로 현재온도 + 오늘 최고/최저 기온 조회
+  4) 화면에 결과 표시
+  5) 도시를 못 찾으면 에러 메시지 표시
+*/
+
+// HTML 요소를 JavaScript에서 사용하기 위해 변수에 저장합니다.
+const cityInput = document.getElementById("cityInput");
+const searchButton = document.getElementById("searchButton");
+
+const errorMessage = document.getElementById("errorMessage");
+const cityName = document.getElementById("cityName");
+const currentTemp = document.getElementById("currentTemp");
+const weatherDescription = document.getElementById("weatherDescription");
+const maxMinTemp = document.getElementById("maxMinTemp");
+
+// Open-Meteo weather code를 사람이 읽기 쉬운 한글 텍스트로 바꿔주는 객체입니다.
+const weatherCodeMap = {
+  0: "맑음",
+  1: "대체로 맑음",
+  2: "부분적으로 흐림",
+  3: "흐림",
+  45: "안개",
+  48: "짙은 안개",
+  51: "약한 이슬비",
+  53: "이슬비",
+  55: "강한 이슬비",
+  61: "약한 비",
+  63: "비",
+  65: "강한 비",
+  71: "약한 눈",
+  73: "눈",
+  75: "강한 눈",
+  80: "약한 소나기",
+  81: "소나기",
+  82: "강한 소나기",
+  95: "뇌우",
+};
+
+// 에러 메시지를 보여주는 함수
+function showError(message) {
+  errorMessage.textContent = message;
+  errorMessage.style.display = "block";
+}
+
+// 에러 메시지를 숨기는 함수
+function clearError() {
+  errorMessage.textContent = "";
+  errorMessage.style.display = "none";
+}
+
+// 섭씨 온도를 "23°C" 형태의 문자열로 바꾸는 함수
+function formatTemp(value) {
+  return `${Math.round(value)}°C`;
+}
+
+// 검색 버튼 클릭 시 실행되는 핵심 함수
+async function searchWeather() {
+  // 입력값의 앞/뒤 공백 제거
+  const query = cityInput.value.trim();
+
+  // 입력값이 비어 있으면 API 호출하지 않고 바로 안내 메시지를 띄웁니다.
+  if (!query) {
+    showError("도시명을 먼저 입력해 주세요.");
+    return;
+  }
+
+  // 새 검색을 시작할 때 기존 에러 메시지는 지웁니다.
+  clearError();
+
+  try {
+    // 1) 도시명을 좌표로 변환하는 Geocoding API 호출
+    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
+      query
+    )}&count=1&language=ko&format=json`;
+
+    const geoResponse = await fetch(geoUrl);
+
+    // HTTP 상태 코드가 실패인 경우 처리
+    if (!geoResponse.ok) {
+      throw new Error("도시 정보를 가져오지 못했습니다.");
+    }
+
+    const geoData = await geoResponse.json();
+
+    // results가 없으면 "도시를 찾지 못함"으로 처리
+    if (!geoData.results || geoData.results.length === 0) {
+      showError("도시를 찾지 못했습니다. 다른 도시명을 입력해 주세요.");
+      return;
+    }
+
+    // 첫 번째 검색 결과 사용
+    const city = geoData.results[0];
+    const { latitude, longitude, name, country } = city;
+
+    // 2) 좌표 기반 날씨 API 호출
+    //    - current=temperature_2m,weather_code: 현재 온도, 날씨 코드
+    //    - daily=temperature_2m_max,temperature_2m_min: 오늘 최고/최저
+    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`;
+
+    const weatherResponse = await fetch(weatherUrl);
+
+    if (!weatherResponse.ok) {
+      throw new Error("날씨 정보를 가져오지 못했습니다.");
+    }
+
+    const weatherData = await weatherResponse.json();
+
+    // 3) 화면 표시용 데이터 정리
+    const tempNow = weatherData.current.temperature_2m;
+    const codeNow = weatherData.current.weather_code;
+    const tempMax = weatherData.daily.temperature_2m_max[0];
+    const tempMin = weatherData.daily.temperature_2m_min[0];
+
+    // 날씨 코드가 사전에 없으면 "알 수 없음" 처리
+    const description = weatherCodeMap[codeNow] || "알 수 없음";
+
+    // 4) 결과를 화면에 반영
+    cityName.textContent = `${name}, ${country}`;
+    currentTemp.textContent = formatTemp(tempNow);
+    weatherDescription.textContent = description;
+    maxMinTemp.textContent = `${formatTemp(tempMax)} / ${formatTemp(tempMin)}`;
+  } catch (error) {
+    // 네트워크 문제 등 예외 발생 시 공통 에러 메시지 표시
+    showError("요청 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
+    console.error(error);
+  }
+}
+
+// 버튼 클릭 시 검색 실행
+searchButton.addEventListener("click", searchWeather);
+
+// 입력창에서 Enter 키를 눌러도 검색되도록 처리
+cityInput.addEventListener("keydown", (event) => {
+  if (event.key === "Enter") {
+    searchWeather();
+  }
+});
 
EOF
)
