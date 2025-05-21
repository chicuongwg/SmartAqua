import fishData from '../assets/data/fish_data.json';

// Lookup tables
const codes_hardi = {
  "Beginner": "Beginner",
  "Easy": "Easy",
  "Medium": "Medium",
  "Difficult": "Difficult"
};

const codes_avail = {
  "Very common": "Very common",
  "Common": "Common",
  "Rare": "Rare",
  "Very rare": "Very rare"
};

const codes_behave = {
  "Schooling": "Schooling",
  "Social": "Social",
  "Solitary": "Solitary"
};

const codes_agres = {
  "Aggressive": "Aggressive",
  "Mostly peaceful": "Mostly peaceful",
  "Peaceful": "Peaceful"
};

const codes_breed = {
  "No record": "No record",
  "Hard": "Hard",
  "Medium": "Medium",
  "Easy": "Easy"
};

/**
 * Tìm tất cả tên cá chứa query (case-insensitive)
 * @param {string} query 
 * @param {Array} fishNames 
 * @returns {Array} danh sách tên cá chứa query
 */
function findMatchesIncluding(query, fishNames) {
  query = query.toLowerCase();
  return fishNames.filter(name => name.toLowerCase().includes(query));
}

/**
 * Format thông tin cá cho hiển thị
 * @param {Object} fish 
 * @returns {Object}
 */
function formatFishInfo(fish) {
  return {
    "Fish Name": fish.name,
    "Minimum Tank Size": `${fish.tankSize} L`,
    "Temperature": `${fish.tempMin} - ${fish.tempMax}℃`,
    "pH Range": `${fish.phMin} - ${fish.phMax}`,
    "Max Size": `${fish.maxSize} cm`,
    "Difficulty": codes_hardi[fish.difficulty] || fish.difficulty || "Unknown",
    "Availability": codes_avail[fish.availability] || fish.availability || "Unknown",
    "Behavior": codes_behave[fish.behavior] || fish.behavior || "Unknown",
    "Aggression": codes_agres[fish.aggression] || fish.aggression || "Unknown",
    "Breeding Difficulty": codes_breed[fish.breedingDifficulty] || fish.breedingDifficulty || "Unknown",
  };
}

/**
 * Lấy thông tin cá dựa trên tên nhập vào
 * Nếu exact match trả info cá đó
 * Nếu không có exact match, trả tất cả cá có tên chứa từ khóa
 * Nếu không tìm thấy cá nào, trả về lỗi
 * 
 * @param {string} fishName 
 * @returns {Object} thông tin cá hoặc danh sách tên cá hoặc lỗi
 */
export function getFishInfo(fishName) {
  const fishNames = fishData.map(fish => fish.name).filter(Boolean);

  console.log(`Searching for: "${fishName}"`);
  console.log(`Found ${fishNames.length} fish names in database`);

  // Tìm exact match (không phân biệt hoa thường)
  const exactMatch = fishNames.find(name => name.toLowerCase() === fishName.toLowerCase());

  if (exactMatch) {
    const fish = fishData.find(f => f.name === exactMatch);
    return formatFishInfo(fish);
  }

  // Không có exact match, tìm tất cả cá chứa từ khóa
  const partialMatches = findMatchesIncluding(fishName, fishNames);

  if (partialMatches.length === 1) {
    const fish = fishData.find(f => f.name === partialMatches[0]);
    return formatFishInfo(fish);
  } else if (partialMatches.length > 1) {
    // Trả về danh sách tên cá để UI có thể hiển thị lựa chọn
    return {
      multipleMatches: true,
      message: `Found multiple fish matching '${fishName}':`,
      matches: partialMatches
    };
  } else {
    return { error: `⚠️ No fish found with name '${fishName}', try another name.` };
  }
}

/**
 * Các hàm khác giữ nguyên và có thể điều chỉnh lại nếu cần
 * Ví dụ hàm recommendFish, recommendEnvironment, analyzeTankConditions...
 * Bạn nhớ chỉnh trường dữ liệu cho phù hợp với JSON của bạn (tankSize, tempMin,...)
 */

export function recommendFish(length, width, height, temperature) {
  const volumeInLiters = (length * width * height) / 1000;

  return fishData
    .filter(fish => {
      const sizeMatch = volumeInLiters >= fish.tankSize;
      const tempMatch = temperature >= fish.tempMin && temperature <= fish.tempMax;
      return sizeMatch && tempMatch;
    })
    .map(fish => ({
      "Name": fish.name,
      "Tank Size": fish.tankSize,
      "Max Size (cm)": fish.maxSize,
      "Temp": (fish.tempMin + fish.tempMax) / 2,
      "Est. Quantity": Math.floor(volumeInLiters / (fish.maxSize * 5))
    }))
    .sort((a, b) => {
      const aFit = a["Tank Size"] / volumeInLiters;
      const bFit = b["Tank Size"] / volumeInLiters;
      return aFit - bFit;
    })
    .slice(0, 10);
}

export function recommendEnvironment(fishList) {
  const matchedFish = [];

  for (const fishName of fishList) {
    const fishNames = fishData.map(fish => fish.name).filter(Boolean);
    const exactMatch = fishNames.find(name => name.toLowerCase() === fishName.toLowerCase());
    if (exactMatch) {
      const fish = fishData.find(f => f.name === exactMatch);
      if (fish) matchedFish.push(fish);
    }
  }

  if (matchedFish.length === 0) {
    return { error: "⚠️ No matching fish found in the list." };
  }

  const avgTankSize = matchedFish.reduce((sum, fish) => sum + fish.tankSize, 0) / matchedFish.length;
  const avgTempMin = matchedFish.reduce((sum, fish) => sum + fish.tempMin, 0) / matchedFish.length;
  const avgTempMax = matchedFish.reduce((sum, fish) => sum + fish.tempMax, 0) / matchedFish.length;
  const avgPhMin = matchedFish.reduce((sum, fish) => sum + fish.phMin, 0) / matchedFish.length;
  const avgPhMax = matchedFish.reduce((sum, fish) => sum + fish.phMax, 0) / matchedFish.length;

  return {
    "Recommended Tank Size": `${avgTankSize.toFixed(1)} L`,
    "Recommended Temperature": `${avgTempMin.toFixed(1)} - ${avgTempMax.toFixed(1)}℃`,
    "Recommended pH Range": `${avgPhMin.toFixed(1)} - ${avgPhMax.toFixed(1)}`,
    "Included Fish": matchedFish.map(fish => fish.name)
  };
}

export function analyzeTankConditions(fishList, currentTemp, currentPh, currentTurbidity, currentQuality) {
  const recommended = recommendEnvironment(fishList);

  if (recommended.error) {
    return recommended;
  }

  const [recommendedTempMin, recommendedTempMax] = recommended["Recommended Temperature"]
    .replace("℃", "")
    .split(" - ")
    .map(parseFloat);

  const [recommendedPhMin, recommendedPhMax] = recommended["Recommended pH Range"]
    .split(" - ")
    .map(parseFloat);

  const recommendations = [];

  if (currentTemp < recommendedTempMin) {
    recommendations.push(`The water temperature is too low (${currentTemp}℃). It should be increased to around ${recommendedTempMin}-${recommendedTempMax}℃.`);
  } else if (currentTemp > recommendedTempMax) {
    recommendations.push(`The water temperature is too high (${currentTemp}℃). It should be decreased to around ${recommendedTempMin}-${recommendedTempMax}℃.`);
  }

  if (currentPh < recommendedPhMin) {
    recommendations.push(`The pH level is too low (${currentPh}). It should be adjusted to around ${recommendedPhMin}-${recommendedPhMax}.`);
  } else if (currentPh > recommendedPhMax) {
    recommendations.push(`The pH level is too high (${currentPh}). It should be adjusted to around ${recommendedPhMin}-${recommendedPhMax}.`);
  }

  if (currentTurbidity > 50) {
    recommendations.push(`The water is too cloudy (${currentTurbidity}/100). Consider changing the water or using a filter.`);
  }

  if (currentQuality < 50) {
    recommendations.push(`The water quality is poor (${currentQuality}/100). Check the filter and change the water regularly.`);
  }

  if (recommendations.length === 0) {
    return { message: "🎉 The aquarium environment is currently ideal!" };
  }

  return { recommendations };
}
