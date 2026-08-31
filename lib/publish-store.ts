// 发布器本地状态：PAT 与草稿都只存浏览器 localStorage
const TOKEN_KEY = "fudao-pat";
const DRAFT_KEY = "fudao-draft";

export type Draft = {
  text: string;
  tags: string[];
  animation: string;
  images: { dataUrl: string; name: string }[];
  savedAt: string;
};

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token.trim());
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(d: Draft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}
