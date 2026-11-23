import { useEffect, useState } from "react";
import { useAuthStore, useStarsStore } from "../store";
import {
  findLegacyAliases,
  findOrCreateMetadataGist,
  hasLegacySharingRisk,
  LegacySharingGist,
  loadMetadataFromGist,
  mutateMetadata,
} from "../services/metadata.service";
import { createOctokitClient } from "../services/github.service";
import { applySessionMetadata } from "../services/session-metadata.service";
import type { StarredRepo } from "../types";

export default function useMetadataSession() {
  const { accessToken, gistId, user, setGistId } = useAuthStore();
  const stars: StarredRepo[] = useStarsStore((state) => state.stars);
  const [error, setError] = useState<unknown>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!accessToken || !user?.id) return;
    let cancelled = false;
    const connect = async () => {
      setError(null);
      try {
        const id = await findOrCreateMetadataGist(accessToken, user.id, gistId);
        if (cancelled) return;
        if (id !== gistId) {
          setGistId(id);
          return;
        }
        let snapshot = await loadMetadataFromGist(accessToken, id, user.id);
        if (!cancelled) applySessionMetadata(accessToken, id, snapshot, stars);

        if (hasLegacySharingRisk(snapshot, id)) {
          if (!cancelled) setError(new LegacySharingGist());
          return;
        }
        if (!stars.length || !navigator.onLine || cancelled) return;
        const aliases = findLegacyAliases(snapshot, stars);
        const matched = new Set([
          ...aliases.map((alias) => alias.key),
          ...Object.values(snapshot.repositories).map((repo) => repo.legacyRepoKey),
        ]);
        const byId = new Map(stars.map((repo) => [repo.id, repo]));
        // A GET by the historical name can resolve a GitHub rename or transfer.
        const client = createOctokitClient(accessToken);
        for (const key of Object.keys(snapshot.repositories)
          .filter((key) => key.includes("/") && !matched.has(key))
          .slice(0, 8)) {
          if (cancelled) return;
          const [owner, repo] = key.split("/");
          try {
            const { data } = await client.repos.get({ owner, repo });
            const current = byId.get(data.id);
            if (current && !snapshot.repositories[data.id]?.repoFullName) {
              aliases.push({ id: current.id, fullName: current.fullName, key });
            }
          } catch {
            // The legacy key remains available for manual recovery.
          }
        }
        if (!cancelled && aliases.length) {
          snapshot = (
            await mutateMetadata(accessToken, id, [{ kind: "repo-aliases", aliases }], user.id)
          ).metadata;
          if (!cancelled) applySessionMetadata(accessToken, id, snapshot, stars);
        }
      } catch (failure) {
        if (!cancelled) setError(failure);
      }
    };
    void connect();
    const reconnect = () => setRetry((value) => value + 1);
    window.addEventListener("online", reconnect);
    return () => {
      cancelled = true;
      window.removeEventListener("online", reconnect);
    };
  }, [accessToken, gistId, user?.id, setGistId, retry, stars]);

  return { error, retry: () => setRetry((value) => value + 1) };
}
