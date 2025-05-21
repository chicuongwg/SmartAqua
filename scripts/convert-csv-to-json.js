const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Dictionary mappings (same as in your Python code)
const codes_hardi = {4: "Beginner", 3: "Easy", 2: "Medium", 1: "Difficult"};
const codes_avail = {4: "Very common", 3: "Common", 2: "Rare", 1: "Very rare"};
const codes_behave = {3: "Schooling", 2: "Social", 1: "Solitary"};
const codes_agres = {3: "Aggressive", 2: "Mostly peaceful", 1: "Peaceful"};
const codes_breed = {4: "No record", 3: "Hard", 2: "Medium", 1: "Easy"};

const results = [];

// Read the CSV file
fs.createReadStream(path.join(__dirname, '..', 'fish_data.csv'))
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    // Create a new array with the transformed data
    const fishData = results.map(fish => ({
      id: fish.fish_id,
      name: fish.name_english,
      altName: fish.alt_name,
      latinName: fish.name_latin,
      tankSize: parseInt(fish.tank_size_liter),
      tempMin: parseFloat(fish.temperature_min),
      tempMax: parseFloat(fish.temperature_max),
      phMin: parseFloat(fish.phmin),
      phMax: parseFloat(fish.phmax),
      maxSize: parseFloat(fish.cm_max),
      difficulty: codes_hardi[parseInt(fish.uncare)] || "Unknown",
      availability: codes_avail[parseInt(fish.availability)] || "Unknown",
      behavior: codes_behave[parseInt(fish.school)] || "Unknown",
      aggression: codes_agres[parseInt(fish.agression)] || "Unknown",
      breedingDifficulty: codes_breed[parseInt(fish.breeding_difficulty)] || "Unknown",
      origin: fish.origin,
      waterType: parseInt(fish.isfish) === 1 ? "Freshwater" : "Saltwater",
      family: fish.family
    }));

    // Write the transformed data to a JSON file
    fs.writeFileSync(
      path.join(__dirname, '..', 'assets', 'data', 'fish_data.json'),
      JSON.stringify(fishData, null, 2)
    );

    console.log(`✅ Converted ${fishData.length} fish records to JSON format`);
  });