/** 업로드된 파일명에서 URL slug 후보를 만든다 (소문자·숫자·하이픈) */
export function slugFromFileName(name: string): string {
  return name
    .replace(/\.(md|markdown|txt|html?|htm)$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function isHtmlFileName(name: string): boolean {
  return /\.(html?|htm)$/i.test(name);
}
