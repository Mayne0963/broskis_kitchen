export const fetchJson = (url: string) =>
  fetch(url, { credentials: "include", cache: "no-store" }).then(r => {
    if (!r.ok) throw new Error("Request failed");
    return r.json();
  });