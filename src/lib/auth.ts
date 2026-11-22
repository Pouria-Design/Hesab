// shortcut: نام کاربری و هش رمز را اینجا بگذار؛ هش را با کد داخل راهنما بساز
export const AUTH_USER = "PUT_USERNAME_HERE";
export const AUTH_HASH = "PUT_HASH_HERE";

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
