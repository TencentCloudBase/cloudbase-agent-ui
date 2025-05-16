import "./index.scss";
import TencentMap from "../TencentMap";
import type { ToolCardProps } from "@cloudbase/agent-ui-react";

import Hunyuan3DCard from "../Hunyuan3DCard";
import WeatherComponent from "../Weather";

export function ToolCard({ name, toolParams, toolData }: ToolCardProps) {
  console.log("name", name);
  if (name === "geocoder" || name === "placeSearchNearby" || name === "directionDriving") {
    return <TencentMap toolData={toolData} toolParams={toolParams} name={name} />;
  }

  if (name === "queryHunyuanTo3DJob") {
    return <Hunyuan3DCard toolData={toolData} toolParams={toolParams} name={name} />;
  }

  if (name === "weather") {
    return <WeatherComponent toolData={toolData} toolParams={toolParams} name={name} />;
  }

  return <></>;
}
