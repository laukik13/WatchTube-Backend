import { v2 as cloudinary } from "cloudinary";
import { extractPublicId } from "cloudinary-build-url";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    //upload file on cloudnary

    //  const response = await cloudinary.uploader.upload(localFilePath,{
    //     resource_type: "auto"
    //  })

    // console.log(localFilePath);

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "laukik",
    });

    //file upload successfully

    //  console.log("file is uplode on Cloudnary", response.url);

    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteImageFromCloudinary = async (localFilePath) => {
  try {
    // console.log(localFilePath)

    if (!localFilePath) return null;

    const public_Id = extractPublicId(localFilePath);

    //  console.log(public_Id)

    const response = await cloudinary.uploader.destroy(public_Id, {
      resource_type: "image",
    });

    return response;
  } catch (error) {
    return null;
  }
};

const deleteVideoFromCloudinary = async (localFilePath) => {
  try {
    // console.log(localFilePath)

    if (!localFilePath) return null;

    const public_Id = extractPublicId(localFilePath);

    //  console.log(public_Id)

    const response = await cloudinary.uploader.destroy(public_Id, {
      resource_type: "video",
    });

    return response;
  } catch (error) {
    return null;
  }
};

export {
  uploadOnCloudinary,
  deleteImageFromCloudinary,
  deleteVideoFromCloudinary,
};
