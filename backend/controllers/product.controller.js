import cloudinary from "../config/cloudinary.js";
import Product from "../models/product.model.js"
import redis from "../utils/redis.js";

export const getAllProducts = async(req, res) => {
    try {
        const products =  await getAllProducts.find({});
        return res.status(200).json({products})
    } catch (error) {
        console.log("Error in getAllProducts", error.message)
        return res.status(500).json({success: false, message: "Internal server error"})
    }
}


export const getFeaturedProducts = async (req, res) => {
    try {
      // Check if featured products are cached in Redis
      let featuredProducts = await redis.get("featured_products");
      
      if (featuredProducts) {
        // If found in Redis, return the cached data
        return res.json(JSON.parse(featuredProducts));
      }
  
      // If not found in Redis, fetch the data from MongoDB
      featuredProducts = await Product.find({ isFeatured: true }).lean();
  
      if (!featuredProducts || featuredProducts.length === 0) {
        return res.status(404).json({ message: "No featured products found" });
      }
  
      // Store the fetched data in Redis and set an expiration (e.g., 1 hour)
      await redis.set(
        "featured_products",
        JSON.stringify(featuredProducts),
        {
          EX: 60 * 60 // 1 hour expiration time (3600 seconds)
        }
      );
  
      // Send the fresh data back to the client
      return res.json(featuredProducts);
  
    } catch (error) {
      console.error("Error in getFeaturedProducts controller:", error.message);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  };


export const createProduct = async(req, res) => {
    try {
		const { name, description, price, image, category, isFeatured } = req.body;

		let cloudinaryResponse = null;

		if (image) {
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
		}

		const product = await Product.create({
			name,
			description,
			price,
			image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
			category,
            isFeatured
		});

        if (isFeatured) {
            await redis.del("featured_products");
        }
		res.status(201).json(product);
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
}

export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (product.image) {
			const publicId = product.image.split("/").pop().split(".")[0];
			try {
				await cloudinary.uploader.destroy(`products/${publicId}`);
				console.log("deleted image from cloduinary");
			} catch (error) {
				console.log("error deleting image from cloduinary", error);
			}
		}

		await Product.findByIdAndDelete(req.params.id);
        if (product.isFeatured) {
            await redis.del("featured_products");
        }
		res.json({ message: "Product deleted successfully" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.aggregate([
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					name: 1,
					description: 1,
					image: 1,
					price: 1,
				},
			},
		]);

		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const products = await Product.find({ category });
		res.json({ products });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) {
			product.isFeatured = !product.isFeatured;
			const updatedProduct = await product.save();
			await redis.del("featured_products");
			res.json(updatedProduct);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};