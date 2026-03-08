/*
  ===========================================
  한국어 상세 지역검색 + 자동완성 + 날씨 조회 앱
  ===========================================

  구성
  1) 자동완성 로직
  2) 지역 검색(지오코딩) 로직
  3) 날씨 조회(Open-Meteo) 로직

  사용 API
  - 지역검색: Nominatim (OpenStreetMap)
    https://nominatim.openstreetmap.org/
  - 날씨: Open-Meteo
    https://open-meteo.com/
*/

// =========================
// 0) DOM 요소 가져오기
// =========================
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");
const autocompleteList = document.getElementById("autocompleteList");

const statusMessage = document.getElementById("statusMessage");
const errorMessage = document.getElementById("errorMessage");

const placeName = document.getElementById("placeName");
const currentTemp = document.getElementById("currentTemp");
const apparentTemp = document.getElementById("apparentTemp");
const maxMinTemp = document.getElementById("maxMinTemp");
const weatherDescription = document.getElementById("weatherDescription");
const precipitation = document.getElementById("precipitation");
const windSpeed = document.getElementById("windSpeed");
const humidity = document.getElementById("humidity");

// 자동완성 상태 관리용 변수
let autocompleteItems = [];
let activeIndex = -1;
let debounceTimer = null;

// 사용자가 자동완성 항목을 선택하면 해당 좌표를 기억했다가 검색에서 재사용
let selectedPlace = null;

// Open-Meteo weather code를 한글 설명으로 매핑
const weatherCodeMap = {
  0: "맑음",
  1: "대체로 맑음",
  2: "부분적으로 흐림",
  3: "흐림",
  45: "안개",
  48: "짙은 안개",
  51: "약한 이슬비",
  53: "이슬비",
  55: "강한 이슬비",
  61: "약한 비",
  63: "비",
  65: "강한 비",
  71: "약한 눈",
  73: "눈",
  75: "강한 눈",
  80: "약한 소나기",
  81: "소나기",
  82: "강한 소나기",
  95: "뇌우",
};

// =========================
// 1) 공통 유틸 함수
// =========================
function setStatus(message = "") {
  statusMessage.textContent = message;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.style.display = "none";
}

function formatTemp(value) {
  return `${Math.round(value)}°C`;
}

function formatNumber(value, unit = "") {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${Math.round(value)}${unit}`;
}

/*
  주소 구성 함수
  - Nominatim address 필드에서 최대한 자세한 행정구역 정보를 결합
  - 예: 역삼동, 강남구, 서울특별시, 대한민국
*/
function buildDetailedAddress(place) {
  const addr = place.address || {};

  const locality = addr.suburb || addr.village || addr.town || addr.city_district || addr.hamlet;
  const district = addr.county || addr.city || addr.state_district;
  const state = addr.state || addr.province;
  const country = addr.country;

  const name = locality || place.name || addr.neighbourhood || "알 수 없는 지역";

  return [name, district, state, country].filter(Boolean).join(", ");
}

// =========================
// 2) 지역 검색(지오코딩) 로직
// =========================
async function searchPlaces(query) {
  // 한국어/영어 모두 대응되도록 accept-language를 ko,en으로 지정
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&accept-language=ko,en&q=${encodeURIComponent(
    query
  )}`;

  // 브라우저 CORS 안정성을 위해 커스텀 헤더 없이 호출합니다.
  // (accept-language는 URL 파라미터로 이미 전달 중)
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("지역 검색 서버 응답이 올바르지 않습니다.");
  }

  const data = await response.json();

  // 필요한 데이터만 뽑아서 사용
  return data.map((item) => ({
    name: item.name || item.display_name,
    displayName: buildDetailedAddress(item),
    lat: Number(item.lat),
    lon: Number(item.lon),
    address: item.address,
  }));
}

// =========================
// 3) 날씨 조회 로직
// =========================
async function fetchWeatherByCoords(lat, lon) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&forecast_days=1&timezone=auto`;

  const response = await fetch(weatherUrl);

  if (!response.ok) {
    throw new Error("날씨 API 응답이 올바르지 않습니다.");
  }

  return response.json();
}

function renderWeather(place, weatherData) {
  const current = weatherData.current;
  const daily = weatherData.daily;

  placeName.textContent = place.displayName;
  currentTemp.textContent = formatTemp(current.temperature_2m);
  apparentTemp.textContent = formatTemp(current.apparent_temperature);
  maxMinTemp.textContent = `${formatTemp(daily.temperature_2m_max[0])} / ${formatTemp(
    daily.temperature_2m_min[0]
  )}`;
  weatherDescription.textContent = weatherCodeMap[current.weather_code] || "알 수 없음";

  const rainProb = daily.precipitation_probability_max?.[0];
  const rainSum = daily.precipitation_sum?.[0];
  const currentRain = current.precipitation;

  // 강수 확률과 강수량을 함께 보여줌
  precipitation.textContent = `${formatNumber(rainProb, "%")} / ${formatNumber(
    rainSum ?? currentRain,
    "mm"
  )}`;

  windSpeed.textContent = formatNumber(current.wind_speed_10m, " km/h");
  humidity.textContent = formatNumber(current.relative_humidity_2m, "%");
}

// =========================
// 4) 자동완성 UI 로직
// =========================
function hideAutocomplete() {
  autocompleteItems = [];
  activeIndex = -1;
  autocompleteList.innerHTML = "";
  autocompleteList.style.display = "none";
  cityInput.setAttribute("aria-expanded", "false");
  cityInput.removeAttribute("aria-activedescendant");
}

function showAutocomplete(items) {
  autocompleteItems = items;
  activeIndex = -1;
  autocompleteList.innerHTML = "";

  if (items.length === 0) {
    hideAutocomplete();
    return;
  }

  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "autocomplete-item";
    li.setAttribute("role", "option");
    li.id = `autocomplete-option-${index}`;
    li.textContent = item.displayName;

    // mousedown을 쓰면 blur 전에 선택 처리 가능(클릭 누락 방지)
    li.addEventListener("mousedown", (event) => {
      event.preventDefault();
      chooseAutocompleteItem(index);
    });

    autocompleteList.appendChild(li);
  });

  autocompleteList.style.display = "block";
  cityInput.setAttribute("aria-expanded", "true");
}

function updateActiveItem() {
  const elements = autocompleteList.querySelectorAll(".autocomplete-item");
  elements.forEach((el, index) => {
    const isActive = index === activeIndex;
    el.classList.toggle("active", isActive);
    if (isActive) {
      cityInput.setAttribute("aria-activedescendant", el.id);
      el.scrollIntoView({ block: "nearest" });
    }
  });
}

function chooseAutocompleteItem(index) {
  const item = autocompleteItems[index];
  if (!item) return;

  cityInput.value = item.displayName;
  selectedPlace = item;
  hideAutocomplete();
}

function debounceAutocompleteSearch() {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    const query = cityInput.value.trim();

    if (!query) {
      hideAutocomplete();
      return;
    }

    try {
      const places = await searchPlaces(query);
      showAutocomplete(places);
    } catch (error) {
      // 자동완성 실패는 치명적 에러가 아니므로 목록만 닫음
      hideAutocomplete();
      console.error(error);
    }
  }, 300);
}

// =========================
// 5) 메인 검색 동작
// =========================
async function searchWeather() {
  const query = cityInput.value.trim();

  if (!query) {
    showError("지역명을 입력해 주세요.");
    hideAutocomplete();
    return;
  }

  clearError();
  setStatus("검색 중...");

  try {
    // 자동완성에서 선택한 값과 현재 입력값이 같으면 그 좌표를 재사용
    let place = null;

    if (selectedPlace && selectedPlace.displayName === query) {
      place = selectedPlace;
    } else {
      const places = await searchPlaces(query);
      if (!places.length) {
        setStatus("");
        showError("지역을 찾을 수 없습니다. 다른 이름으로 검색해 보세요.");
        return;
      }
      place = places[0];
    }

    const weatherData = await fetchWeatherByCoords(place.lat, place.lon);
    renderWeather(place, weatherData);

    setStatus("검색 완료");
    hideAutocomplete();
  } catch (error) {
    console.error(error);
    setStatus("");

    if (String(error.message || "").includes("지역")) {
      showError("지역을 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } else {
      showError("날씨 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }
}

// =========================
// 6) 이벤트 연결
// =========================
searchButton.addEventListener("click", searchWeather);

cityInput.addEventListener("input", () => {
  // 사용자가 새로 입력하면 기존 선택 정보는 무효화
  selectedPlace = null;
  debounceAutocompleteSearch();
});

cityInput.addEventListener("keydown", (event) => {
  const hasList = autocompleteItems.length > 0 && autocompleteList.style.display === "block";

  // 방향키: 자동완성 항목 이동
  if (hasList && event.key === "ArrowDown") {
    event.preventDefault();
    activeIndex = (activeIndex + 1) % autocompleteItems.length;
    updateActiveItem();
    return;
  }

  if (hasList && event.key === "ArrowUp") {
    event.preventDefault();
    activeIndex = (activeIndex - 1 + autocompleteItems.length) % autocompleteItems.length;
    updateActiveItem();
    return;
  }

  // Enter: 자동완성 활성 항목 선택 또는 검색 실행
  if (event.key === "Enter") {
    event.preventDefault();

    if (hasList && activeIndex >= 0) {
      chooseAutocompleteItem(activeIndex);
      searchWeather();
      return;
    }

    searchWeather();
  }

  // Esc: 목록 닫기
  if (event.key === "Escape") {
    hideAutocomplete();
  }
});

// 입력창 바깥 클릭 시 자동완성 닫기
document.addEventListener("click", (event) => {
  if (!event.target.closest(".autocomplete-wrapper")) {
    hideAutocomplete();
  }
});
