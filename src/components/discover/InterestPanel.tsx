import { useState } from "react";
import type { InterestProfile } from "../../types/discovery";
import type { InferredInterests } from "../../services/recommendation.service";

const presets = ["ai-agent", "llm", "computer-vision", "3d-gaussian-splatting", "developer-tools"];
const split = (value: string) =>
  [
    ...new Set(
      value
        .split(/[,，\n]/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 20);

export default function InterestPanel({
  profile,
  inferred,
  onSave,
  onResetFeedback,
}: {
  profile: InterestProfile;
  inferred: InferredInterests;
  onSave: (profile: InterestProfile) => void;
  onResetFeedback: () => void;
}) {
  const [draft, setDraft] = useState(profile);
  const [newTopic, setNewTopic] = useState("");
  const [blocked, setBlocked] = useState({
    blockedTopics: profile.blockedTopics.join(", "),
    blockedLanguages: profile.blockedLanguages.join(", "),
    blockedKeywords: profile.blockedKeywords.join(", "),
  });
  const add = (value: string) => {
    const name = value.trim().toLowerCase().slice(0, 50);
    if (!name || draft.topics.length >= 20 || draft.topics.some((item) => item.name === name))
      return;
    setDraft((state) => ({ ...state, topics: [...state.topics, { name, weight: 2 }] }));
    setNewTopic("");
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          ...draft,
          blockedTopics: split(blocked.blockedTopics),
          blockedLanguages: split(blocked.blockedLanguages),
          blockedKeywords: split(blocked.blockedKeywords),
        });
      }}
    >
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
          />
          启用个性化
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.infer}
            onChange={(event) => setDraft({ ...draft, infer: event.target.checked })}
          />
          从我的 Stars、标签和收藏夹推断
        </label>
      </div>
      {!!inferred.topics.length && draft.infer && (
        <p className="text-sm text-text-secondary">
          从 Stars 推断的话题：{inferred.topics.slice(0, 6).join("、")}
        </p>
      )}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2" aria-label="话题示例">
          {presets.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => add(topic)}
              className="rounded-full border border-border px-2.5 py-1 text-sm hover:bg-surface-darker"
            >
              + {topic}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[170px] flex-1 text-sm">
            关注话题
            <input
              className="input mt-1"
              maxLength={50}
              value={newTopic}
              onChange={(event) => setNewTopic(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  add(newTopic);
                }
              }}
            />
          </label>
          <button type="button" className="btn-secondary" onClick={() => add(newTopic)}>
            添加话题
          </button>
        </div>
        <ul className="space-y-1">
          {draft.topics.map((topic) => (
            <li
              key={topic.name}
              className="flex flex-wrap items-center gap-2 rounded bg-surface px-2 py-1 text-sm"
            >
              <span className="min-w-0 flex-1 break-words">{topic.name}</span>
              <select
                aria-label={`${topic.name} 的关注程度`}
                className="rounded border border-border bg-surface-card px-2 py-1"
                value={topic.weight}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    topics: draft.topics.map((item) =>
                      item.name === topic.name
                        ? { ...item, weight: Number(event.target.value) }
                        : item,
                    ),
                  })
                }
              >
                <option value={1}>低</option>
                <option value={2}>中</option>
                <option value={3}>高</option>
              </select>
              <button
                type="button"
                className="btn-ghost"
                onClick={() =>
                  setDraft({ ...draft, topics: draft.topics.filter((item) => item !== topic) })
                }
                aria-label={`移除 ${topic.name}`}
              >
                移除
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {(
          [
            ["blockedTopics", "屏蔽话题"],
            ["blockedLanguages", "屏蔽语言"],
            ["blockedKeywords", "屏蔽关键词"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              className="input mt-1"
              maxLength={500}
              placeholder="用逗号分隔"
              value={blocked[key]}
              onChange={(event) => setBlocked({ ...blocked, [key]: event.target.value })}
            />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" type="submit">
          保存兴趣
        </button>
        <button className="btn-secondary" type="button" onClick={onResetFeedback}>
          重置推荐反馈
        </button>
      </div>
    </form>
  );
}
