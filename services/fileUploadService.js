import { decode } from "base64-arraybuffer";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import mime from "mime";
import { supabase } from "../config/supabase";

export const pickFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: false,  // IMPORTANT
      multiple: false,
    });

    if (result.canceled) return null;

    return result.assets[0];
  } catch (error) {
    console.log("❌ pickFile error:", error);
    return null;
  }
};

export const uploadToSupabase = async (file) => {
  try {
    if (!file) throw new Error("No file selected");

    const originalUri = file.uri;

    // 1️⃣ Copy file to local filesystem (fixes content:// issue)
    const newPath =
      FileSystem.documentDirectory + file.name;

    await FileSystem.copyAsync({
      from: originalUri,
      to: newPath,
    });

    // 2️⃣ Read the copied file (base64)
    const base64File = await FileSystem.readAsStringAsync(newPath, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3️⃣ Convert base64 → byte array
    const fileBytes = decode(base64File);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const mimeType = mime.getType(fileExt) || "application/octet-stream";

    const path = `uploads/${fileName}`;

    // 4️⃣ Upload to Supabase
    const { error } = await supabase.storage
      .from("chat-files")
      .upload(path, fileBytes, {
        contentType: mimeType,
      });

    if (error) {
      console.log("❌ Supabase upload error:", error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from("chat-files")
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.log("❌ uploadToSupabase error:", error);
    throw new Error("Upload failed");
  }
};
