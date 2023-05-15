// const express = require('express');
// const openalpr = require('node-openalpr');
// const fs = require('fs');
// const path = require('path');
// const mongoDB = require('mongodb');

// // Create an Express app.
// const app = express();

// // Connect to MongoDB.
// const mongoClient = new mongoDB.MongoClient(
//     "mongodb+srv://doradlahari:numberplatedetection@cluster0.g8zx4ga.mongodb.net/" +
//       dbName +
//       "?retryWrites=true&w=majority",
//     { useNewUrlParser: true, useUnifiedTopology: true }
//   )
//   .then(() => {
//     console.log("number plate detection  db had connected newly.....!!!!!");
//     app.listen(3000, () => {
//       console.log(" server is listening on 3000 ");
//     });
//   })
//   .catch((err) => {
//     console.log(err);
//   });;

// // Create a route to detect license plates.
// app.post('/detect', (req, res) => {
//   // Load the license plate image.
//   const imagePath = path.join(__dirname, req.body.image);
//   const image = fs.readFileSync(imagePath);

//   // Create an openalpr object.
//   const alpr = new openalpr();

//   // Detect the license plates in the image.
//   const plates = alpr.recognize(image);

//   // Save the license plates to MongoDB.
//   for (const plate of plates) {
//     const plateDocument = {
//       plate: plate.plate,
//       image: imagePath,
//     };

//     mongoClient.db('license-plate-detection').collection('plates').insertOne(plateDocument, (err, result) => {
//       if (err) {
//         console.log(err);
//         res.status(500).send('An error occurred.');
//       } else {
//         res.status(200).send('The license plates were successfully detected and saved.');
//       }
//     });
//   }

// });

// // Start the app.
// app.listen(3000, () => {
//   console.log('App listening on port 3000.');
// });

// const express = require("express");
// const multer = require("multer");
// const Jimp = require("jimp");
// const { MongoClient } = require("mongodb");
// const path = require("path");

// const app = express();

// // Multer configuration for file upload
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "uploads");
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//         const extension = path.extname(file.originalname);
//         cb(null, uniqueSuffix + extension);
//     },
// });

// const upload = multer({ storage });

// // MongoDB configuration
// const dbName = "number-plate-detection";
// const collectionName = "number-plate-detection";
// const mongoURL = "mongodb+srv://doradlahari:numberplatedetection@cluster0.g8zx4ga.mongodb.net/";
// const client = new MongoClient(mongoURL);

// // Connect to MongoDB
// // Connect to MongoDB
// async function connectToMongo() {
//     try {
//         await client.connect();
//         console.log("Connected to MongoDB");

//         // Access a sample collection to verify the connection
//         const db = client.db(dbName);
//         const collection = db.collection(collectionName);
//         const count = await collection.countDocuments();
//         console.log(`Number of documents in the collection: ${count}`);
//     } catch (error) {
//         console.error("Error connecting to MongoDB:", error);
//     }
// }

// // Express app setup
// app.use(express.json());

// // Route for uploading the image and detecting the number plate
// app.post("/upload", upload.single("image"), async (req, res) => {
//     try {
//         // Read the uploaded image using Jimp
//         const imagePath = path.join(__dirname, req.file.path);
//         const image = await Jimp.read(imagePath);

//         // Perform number plate detection using image processing operations
//         // ...

//         // Save the processed image
//         const processedImagePath = path.join(
//             __dirname,
//             "processed",
//             req.file.filename
//         );
//         await image.writeAsync(processedImagePath);

//         // Store the image path and detection result in MongoDB
//         const db = client.db(dbName);
//         const collection = db.collection(collectionName);
//         const result = await collection.insertOne({
//             imagePath: processedImagePath,
//             detectionResult: "Number plate detected",
//         });

//         res.send("Image uploaded and number plate detected successfully!");
//     } catch (error) {
//         console.error("Error processing image:", error);
//         res.status(500).send("Error processing image");
//     }
// });

// // Start the server
// const port = 3000;
// app.listen(port, () => {
//     console.log(`Server started on port ${port}`);
//     connectToMongo();
// });


const express = require("express");
const multer = require("multer");
const Jimp = require("jimp");
const Tesseract = require("tesseract.js");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();

// Multer configuration for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension);
    },
});

const upload = multer({ storage });

// MongoDB configuration
const dbName = "number-plate-detection";
const collectionName = "number-plate-detection";
const mongoURL =
    "mongodb+srv://doradlahari:numberplatedetection@cluster0.g8zx4ga.mongodb.net/";
const client = new MongoClient(mongoURL);

// Connect to MongoDB
async function connectToMongo() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        // Access a sample collection to verify the connection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`Number of documents in the collection: ${count}`);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

// Function to process the image and extract text using Tesseract.js
async function processImage(imagePath) {
    // Read the image using Jimp
    const image = await Jimp.read(imagePath);

    // Convert the image to grayscale
    image.grayscale();

    // Enhance the image for better OCR results (you can customize this step)
    image.contrast(1);
    image.brightness(1);

    // Save the processed image to a temporary file
    const processedImagePath = path.join(__dirname, "processed", "temp.jpg");
    await image.writeAsync(processedImagePath);

    // Perform OCR using Tesseract.js
    const { data: { text } } = await Tesseract.recognize(processedImagePath, "eng", {
        tessjs_create_pdf: "0",
        tessjs_create_hocr: "0"
    });

    // Delete the temporary image file
    // await Jimp.read(processedImagePath).then(image => image.unlink());

    return text;
}

// Express app setup
app.use(express.json());

// Route for uploading the image and detecting the number plate
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        // Read the uploaded image using Jimp
        const imagePath = path.join(__dirname, req.file.path);

        // Perform number plate detection by extracting text from the image using Tesseract.js
        const detectedText = await processImage(imagePath);

        // Store the image path and detection result in MongoDB
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const result = await collection.insertOne({
            imagePath: imagePath,
            detectionResult: detectedText,
        });

        if (detectedText) {
            res.send(`Image uploaded and number plate detected successfully! Detected Number: ${detectedText}`);
        } else {
            res.send("Image uploaded, but number plate not detected.");
        }
    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).send("Error processing image");
    }
});


// Start the server
const port = 3000;
connectToMongo().then(() => {
    app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
});

module.exports = app;