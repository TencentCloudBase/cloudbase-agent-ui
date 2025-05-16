import { AgentUI } from "@cloudbase/agent-ui-react";
import cloudbase from "@cloudbase/js-sdk";
import { useEffect, useState } from "react";
import { ToolCard } from "./components/ToolCard";

const tcb = cloudbase.init({
  env: import.meta.env.VITE_ENV_ID,
});
const auth = tcb.auth({ persistence: "local" });

export function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    auth.signInAnonymously().then(() => {
      setReady(true);
    });
  });

  if (!ready) {
    return null;
  }
  return (
    <div>
      <AgentUI
        tcb={tcb}
        style={{ width: "100vw", height: "100vh" }}
        chatMode="bot"
        showBotAvatar={true}
        agentConfig={{
          botId: import.meta.env.VITE_BOT_ID,
          allowWebSearch: true,
          allowUploadFile: true,
          allowPullRefresh: true,
          allowUploadImage: true,
          showToolCallDetail: true,
          allowMultiConversation: true,
        }}
        modelConfig={{
          modelProvider: "deepseek",
          quickResponseModel: "deepseek-v3",
          deepReasoningModel: "deepseek-r1",
        }}
        toolCardComponent={ToolCard}
      />
    </div>
  );
}

export default App;
