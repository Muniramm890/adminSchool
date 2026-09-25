// path: src/modules/commhub/CommHubModule.tsx

import { useState } from 'react';
import { ComposeMessageTab, MessageHistoryTab } from './CommHubTabs';
import { useSession } from '../../shared/context/AppContexts';
import { C } from '../../shared/theme';
import { SectionHeader } from '../../shared/ui/Common';



export const CommHubModule = () => {
  const { currentYear } = useSession();
  const [tab, setTab] = useState("compose"); // 'compose' | 'history'

  return (
    <div>
      <SectionHeader
        title="Communication Hub"
        sub="Targeted notices and notifications -- in-app and email, with attachments, from one place."
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: "compose", label: "Compose" },
          { id: "history", label: "History" },
        ].map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            style={{
              padding: "10px 16px", border: "none", background: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 13.5,
              color: tab === tb.id ? C.blue : C.textMuted,
              borderBottom: tab === tb.id ? `2px solid ${C.blue}` : "2px solid transparent",
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "compose" && <ComposeMessageTab academicYearId={currentYear?.id} onSent={() => setTab("history")} />}
      {tab === "history" && <MessageHistoryTab />}
    </div>
  );
};
