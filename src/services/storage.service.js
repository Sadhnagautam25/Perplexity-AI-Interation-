import dotenv from "dotenv";
dotenv.config();
import ImageKit from "imagekit";

const client = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function uploadFile({ buffer, fileName, folder = "" }) {
  const response = await client.upload({
    file: buffer, // buffer directly
    fileName: fileName,
    folder: folder,
  });

  return response;
}

export default uploadFile;
