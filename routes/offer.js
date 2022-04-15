//Import packages
const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const morgan = require("morgan");

//Configurer cloudinary
cloudinary.config({
  cloud_name: "dygjptmlc",
  api_key: "728436132528678",
  api_secret: "_IWFjUCr_FPbETBVhjPDUqKkg9A",
});

//Import models
const Userlogins = require("../models/Userlogins");
const Offer = require("../models/Offer");

//Import middlewares
const isAuthenticated = require("../isAuthenticated");
const checkId = require("../checkId");
// const uploadImage = require("../uploadImage");

//Create - Creation de route
router.post("/offer/publish", isAuthenticated, async (req, res) => {
  console.log("route :/offer/publish");
  try {
    // Creation d'une nouvelle offre dans la bdd
    const newOffer = new Offer({
      product_name: req.fields.title,
      product_description: req.fields.description,
      product_price: req.fields.price,
      product_details: [
        { MARQUE: req.fields.brand },
        { TAILLE: req.fields.size },
        { ETAT: req.fields.condition },
        { COULEUR: req.fields.color },
        { EMPLACEMENT: req.fields.city },
      ],
      // product_image: req.img.secure_url,
      owner: req.user,
    });

    const path = "/vinted/offers/";

    let imgToUpload = req.files.picture.path;
    const imgUploaded = await cloudinary.uploader.upload(imgToUpload, {
      folder: path,
      public_id: newOffer._id,
    });

    newOffer.product_image = imgUploaded.secure_url;

    // newOffer = newOffer.populate("Userlogins");

    await newOffer.save();

    res.status(200).json(newOffer);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

//Put - Modifier les annonces
router.put("/offer/edit", isAuthenticated, async (req, res) => {
  console.log("route :/offer/edit");
  try {
    const {
      id,
      title,
      description,
      price,
      brand,
      size,
      color,
      city,
      condition,
    } = req.fields;
    const offer = await Offer.findOne({
      id: id,
      token: req.user.token,
    });
    if (title) {
      offer.product_name = title;
    }
    if (description) {
      offer.product_description = description;
    }
    if (price) {
      offer.product_price = price;
    }
    if (brand) {
      offer.product_details[0].MARQUE = brand;
    }
    if (size) {
      offer.product_details[1].TAILLE = size;
    }
    if (condition) {
      offer.product_details[2].ETAT = condition;
    }
    if (color) {
      offer.product_details[3].COULEUR = color;
    }
    if (city) {
      offer.product_details[4].EMPLACEMENT = city;
    }
    console.log("files", req.files);
    if (req?.files?.picture?.size) {
      const imgToUpload = req.files.picture.path;
      const imgUploaded = await cloudinary.uploader.upload(imgToUpload, {
        folder: "/vinted/offers/",
        public_id: offer._id,
      });
      offer.product_image = imgUploaded.secure_url;
    }
    offer.markModified("product_details");
    await offer.save();
    res.status(200).json(offer);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

//Delete - Supprimer une annonce
// router.delete("/offer/delete", isAuyhrn);

//Get - Filtrer les recuperation du tableau
router.get("/offer", async (req, res) => {
  console.log("route :/offer");
  try {
    let limit = 5;
    let skip = 0;
    let page = 1;
    let priceMax = {};
    let priceMin = {};
    let priceSort = 0;

    // Pagination
    if (req.query.page) {
      page = req.query.page - 1;
      limit = 3;
      skip = 3 * page;
    }
    // Price max
    if (req.query.priceMax) {
      priceMax = Number(req.query.priceMax);
    } else {
      priceMax = 10000;
    }
    // Price min
    if (req.query.priceMin) {
      priceMin = Number(req.query.priceMin);
    } else {
      priceMin = 0;
    }
    // Price sort
    if (req.query.sort) {
      if (req.query.sort.includes("desc")) {
        priceSort = -1;
      } else {
        priceSort = 1;
      }
    }
    //Do query
    const pageData = await Offer.find({
      product_name: new RegExp(req.query.title, "i"),
      product_price: { $lte: priceMax, $gte: priceMin },
    })
      .sort({ product_price: priceSort })
      .limit(limit)
      .skip(skip);

    res.status(200).json(pageData);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// Get id params
router.get("/offer/:id", async (req, res) => {
  console.log("route :offer/:id");
  try {
    const offers = await Offer.findById(req.params.id).populate("owner");
    res.status(200).json(offers);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});
module.exports = router;