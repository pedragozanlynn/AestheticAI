import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../config/supabase";

export const pickFile = async () => {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (res.canceled) return null;

    const file = res.assets[0];

    return {
      uri: file.uri,
      name: file.name,
      mimeType: file.mimeType || "application/octet-stream",
    };
  } catch (error) {
    console.log("❌ File picker error:", error);
    return null;
  }
};

export const uploadToSupabase = async (file) => {
  try {
    const fileExt = file.name.split(".").pop();
    const filePath = `uploads/${Date.now()}.${fileExt}`;

    // Read the file as arraybuffer
    const response = await fetch(file.uri);
    const arrayBuffer = await response.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    const { data, error } = await supabase.storage
      .from("chat-files")
      .upload(filePath, fileBytes, {
        contentType: file.mimeType,
        upsert: false,
      });

    if (error) {
      console.log("❌ Supabase upload error:", error);
      return null;
    }

    const { data: publicURL } = supabase.storage
      .from("chat-files")
      .getPublicUrl(filePath);

    return {
      fileUrl: publicURL.publicUrl,
      fileName: file.name,
      fileType: file.mimeType,
    };
  } catch (err) {
    console.log("❌ uploadToSupabase error:", err);
    return null;
  }
};

/////////////////////////////////////////////////////////////////////////////////////
// ✅ ADD ONLY — Portfolio Upload (NEW FUNCTION, NOTHING IN ORIGINAL CODE CHANGED)
/////////////////////////////////////////////////////////////////////////////////////

export const uploadPortfolio = async (file) => {
  try {
    const fileExt = file.name.split(".").pop();
    const filePath = `portfolio/${Date.now()}.${fileExt}`;

    const response = await fetch(file.uri);
    const arrayBuffer = await response.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    const { data, error } = await supabase.storage
      .from("portfolio-file")   // 👉 NEW BUCKET
      .upload(filePath, fileBytes, {
        contentType: file.mimeType,
        upsert: false,
      });

    if (error) {
      console.log("❌ Portfolio upload error:", error);
      return null;
    }

    const { data: publicURL } = supabase.storage
      .from("portfolio-file")
      .getPublicUrl(filePath);

    return {
      fileUrl: publicURL.publicUrl,
      fileName: file.name,
      fileType: file.mimeType,
    };
  } catch (err) {
    console.log("❌ uploadPortfolio error:", err);
    return null;
  }
};
