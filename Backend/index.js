import express from "express";
import { PORT, mongoURL } from "./config.js";
import mongoose from "mongoose";
import { Item } from "./models/itemmodel.js";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use('/files', express.static("files"));

// Ensure upload directory exists
const uploadDir = './files';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET all items
app.get("/item", async (req, res) => {
  try {
    const items = await Item.find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .select('-__v'); // Exclude version key
    
    return res.status(200).json({
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ 
      message: "Error fetching items", 
      error: error.message 
    });
  }
});

// POST new item
app.post("/item", upload.single("file"), async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['name', 'email', 'phoneno', 'title', 'description'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: "Missing required fields", 
        fields: missingFields 
      });
    }

    // Create new item
    const newItem = {
      name: req.body.name,
      email: req.body.email,
      phoneno: req.body.phoneno,
      title: req.body.title,
      description: req.body.description,
      image: req.file ? req.file.filename : null,
    };

    const item = await Item.create(newItem);
    console.log('New item created:', item._id);
    
    return res.status(201).json({
      message: "Item created successfully",
      item: item
    });

  } catch (error) {
    console.error('Error creating item:', error);
    if (req.file) {
      // Clean up uploaded file if item creation fails
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ 
      message: "Error creating item", 
      error: error.message 
    });
  }
});

// GET item by ID
app.get("/item/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await Item.findById(req.params.id).select('-__v');
    
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ 
      message: "Error fetching item", 
      error: error.message 
    });
  }
});

// DELETE item
app.delete("/item/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Delete associated image file if it exists
    if (item.image) {
      const imagePath = path.join('./files', item.image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting image file:', err);
      });
    }

    await Item.findByIdAndDelete(req.params.id);
    console.log('Item deleted successfully:', req.params.id);

    return res.status(200).json({ 
      message: "Item deleted successfully",
      itemId: req.params.id
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ 
      message: "Error deleting item", 
      error: error.message 
    });
  }
});

// Database connection
mongoose.connect(mongoURL)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: "Something went wrong!", 
    error: err.message 
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});