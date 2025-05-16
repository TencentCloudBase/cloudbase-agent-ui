import React, { useState, useEffect } from "react";
import { ZipModelViewer } from "../ZipModelViewer";
import type { ToolCardProps } from "@cloudbase/agent-ui-react";

const Hunyuan3DCard = (props: ToolCardProps) => {
  const { toolData, toolParams, name } = props;
  const [progress, setProgress] = useState(0);
  const [taskStatus, setTaskStatus] = useState("RUN");
  const [url, setUrl] = useState("");
  const zipUrl =
    "https://6c75-luke-agent-dev-7g1nc8tqc2ab76af-1259218801.tcb.qcloud.la/tmp/1cbe9cebd6845df14b269a71b17c864c.zip";

  const handleError = (error: Error) => {
    console.error("模型加载失败:", error);
  };

  const handleProgress = (value: number) => {
    setProgress(value);
  };

  useEffect(() => {
    if (name === "queryHunyuanTo3DJob" && toolData?.toolResult) {
      try {
        setTaskStatus(toolData.toolResult.Status);
        if (toolData.toolResult.Status === "DONE") {
          const resultInfo = toolData.toolResult.ResultFile3Ds[0];
          const result = resultInfo.File3D.find((item: any) => item.Type === "OBJ");
          setUrl(result.Url);
        }
      } catch (e) {
        console.error("Error parsing hunyuan3D task data:", e);
      }
    }
  }, []);

  return taskStatus === "DONE" ? (
    <div>
      <ZipModelViewer zipUrl={zipUrl} showLoading={true} onError={handleError} onProgress={handleProgress} />
    </div>
  ) : (
    <div></div>
  );
};

export default Hunyuan3DCard;
