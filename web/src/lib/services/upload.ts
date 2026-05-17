import { supabase } from "@/lib/supabase/client";

export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${productId}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error("Upload error:", err);
    return null;
  }
}

export async function deleteProductImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from("product-images")
      .remove([path]);
    return !error;
  } catch {
    return false;
  }
}
