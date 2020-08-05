// Declare requirement variables
const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();

// Set up new express app
const app = express();

// Set up sqlite database and create a new table
let db = new sqlite3.Database(':memory:');
db.run('CREATE TABLE sorting(input text PRIMARY KEY,output text,instructions text)', (error) => {
    if (error) {
        return console.log(error.message);
    }
    console.log("Created new table.");
});

// Set up static folder to access files, set up body parser
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

// Give access to front-end
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Used to record steps of sorting process.
let splitSteps = [];
let mergeSteps = [];

// Post route for merge sort
app.post("/mergeSort", function(req, res){
    const dataType = req.body.dataType;
    const data = req.body.data;
    let array = [];
    let results = {
        sorted: [],
        steps: []
    }

    // Create array to be sorted. If string, split as is. If int, change values from strings to ints.
    if (dataType === "str") {
        array = data.split(",");
    } else if (dataType === "int") {
        array = data.split(",").map(x => parseInt(x));
    }

    // Reset arrays for every new input
    splitSteps = [];
    mergeSteps = [];

    // Send array to be sorted using merge sort.
    results.sorted = mergeSort(array);
    results.steps = splitSteps.concat(mergeSteps);

    // Insert data into sqlite database.
    let sql = `INSERT INTO sorting(input, output, instructions) VALUES ("${array.toString()}", "${results.sorted.toString()}", "${results.steps.toString()}")`;
    db.run(sql,[], (error) => {
        if(error) {
            return console.log(error.message);
        }
        console.log("Inserted into table.");
    });

    res.send(results);
})

// App listener
app.listen(process.env.PORT || 4000, function() {
    console.log("Listening on port 4000.");
})

// Merge sort function
function mergeSort (array) {
    if (array.length < 2) {     // Can no longer sub-divide array
        return array;
    }
    let median = Math.floor(array.length / 2);  // Used to halve array
    const left = mergeSort(array.slice(0,median));
    const right = mergeSort(array.slice(median));
    splitSteps.unshift(`Split [${array}] into [${left}] and [${right}].`);
    return merges(left, right);  // Send to merge function to begin placing values in correct order
}

// Merge sort helper
function merges (left, right) {
    let result = [];
    mergeSteps.push(`Merge [${left}] and [${right}].`)
    // Loop through the left and right arrays and compare values
    while (left.length > 0 && right.length > 0) {
        if (left[0] < right[0]) {
            result.push(left.shift());  // Left value larger, remove from left and add to result
        } else {
            result.push(right.shift()); // Opposite of above
        }
    }
    // return result with any leftover values added to the end
    return result.concat(left.length > 0 ? left : right);
}