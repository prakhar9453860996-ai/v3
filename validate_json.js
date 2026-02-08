const fs = require('fs');
const data = JSON.parse(fs.readFileSync('plant_disease.json', 'utf8'));

let missing = [];
data.forEach((item, index) => {
    if (!item.name_hi || !item.cause_hi || !item.cure_hi) {
        missing.push({
            index,
            name: item.name,
            missing_fields: []
        });
        if (!item.name_hi) missing[missing.length - 1].missing_fields.push('name_hi');
        if (!item.cause_hi) missing[missing.length - 1].missing_fields.push('cause_hi');
        if (!item.cure_hi) missing[missing.length - 1].missing_fields.push('cure_hi');
    }
});

if (missing.length === 0) {
    console.log("All " + data.length + " entries have Hindi translations.");
} else {
    console.log("Missing translations for " + missing.length + " entries:");
    console.log(JSON.stringify(missing, null, 2));
}
