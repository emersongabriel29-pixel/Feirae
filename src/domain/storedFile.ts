export type StoredFile = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  savedAt: string;
};

const DEFAULT_MAX_BYTES = 1_500_000;

export function readFileForLocalStorage(file: File, maxBytes = DEFAULT_MAX_BYTES) {
  return new Promise<StoredFile>((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error("Arquivo muito grande para o armazenamento local. Use até 1,5 MB neste protótipo."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () =>
      resolve({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl: String(reader.result ?? ""),
        savedAt: new Date().toISOString(),
      });
    reader.readAsDataURL(file);
  });
}

export function storedFileLabel(file?: StoredFile | null) {
  if (!file) return "";
  const sizeKb = Math.max(1, Math.round(file.size / 1024));
  return `${file.name} · ${sizeKb} KB`;
}
