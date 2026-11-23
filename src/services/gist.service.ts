import { createOctokitClient } from "./github.service";

export const METADATA_FILE = "starkeeper-metadata.json";
export const SHARE_FILE = "starkeeper-share-v1.json";

export function listOwnedGists(token: string) {
  const client = createOctokitClient(token);
  return client.paginate(client.gists.list, { per_page: 100 });
}

export async function createGist<T>(
  token: string,
  description: string,
  filename: string,
  value: T,
) {
  const { data } = await createOctokitClient(token).gists.create({
    description,
    public: false,
    files: { [filename]: { content: JSON.stringify(value) } },
  });
  if (!data.id) throw new Error("GitHub 未返回新 Gist 的 ID");
  return data.id;
}

export async function fetchGist(token: string | undefined, id: string) {
  const { data } = await createOctokitClient(token).gists.get({
    gist_id: id,
  });
  return data;
}

export async function writeGistFiles(
  token: string,
  id: string,
  files: Record<string, { content: string }>,
) {
  await createOctokitClient(token).gists.update({ gist_id: id, files });
}

type GistFile = { truncated?: boolean; content?: string; raw_url?: string };
export async function readGistJson(file: GistFile | null | undefined): Promise<unknown> {
  if (!file) throw new Error("Gist 缺少所需文件");
  if (!file.truncated && file.content) return JSON.parse(file.content);
  if (file.truncated && file.raw_url) {
    const url = new URL(file.raw_url);
    if (url.origin !== "https://gist.githubusercontent.com")
      throw new Error("无效的 Gist 文件来源");
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "error",
      credentials: "omit",
    });
    if (response.ok) return response.json();
  }
  throw new Error("无法读取完整的 Gist 文件");
}

export function statusOf(error: unknown): number | undefined {
  return (error as { status?: number } | null)?.status;
}
